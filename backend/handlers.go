package main

import (
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/jinzhu/gorm"
	"github.com/labstack/echo"
	"golang.org/x/crypto/bcrypt"
)

func codegen(length int) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func codeLength() int {
	if v := os.Getenv("CODE_LENGTH"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			return n
		}
	}
	return 6
}

func uniqueCode() string {
	for {
		code := codegen(codeLength())
		var count int
		db.Model(&Link{}).Where("code = ?", code).Count(&count)
		if count == 0 {
			return code
		}
	}
}

// shortenURL creates a new shortened link
func shortenURL(c echo.Context) error {
	type Req struct {
		LongURL      string `json:"lurl"`
		BaseURL      string `json:"base_url"`
		Code         string `json:"code"`
		RequiresAuth bool   `json:"requires_auth"`
	}

	r := new(Req)
	if err := c.Bind(r); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}
	if r.LongURL == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "URL is required")
	}

	if r.BaseURL == "" {
		r.BaseURL = os.Getenv("BASE_URL")
		if r.BaseURL == "" {
			return echo.NewHTTPError(http.StatusInternalServerError, "Base URL not configured")
		}
	}

	// Authenticated user
	var userID *uint
	if uid, ok := c.Get("user_id").(uint); ok {
		userID = &uid
	}

	if r.RequiresAuth && userID == nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Login required to create protected links")
	}

	// Determine short code
	isCustom := false
	code := r.Code
	if code != "" {
		isCustom = true
		if len(code) < 2 || len(code) > 32 {
			return echo.NewHTTPError(http.StatusBadRequest, "Custom code must be 2–32 characters")
		}
		var existing Link
		if db.Where("code = ?", code).First(&existing).Error == nil {
			return echo.NewHTTPError(http.StatusConflict, "Short code already taken")
		}
	} else {
		code = uniqueCode()
	}

	link := Link{
		UserID:       userID,
		Code:         code,
		LongURL:      r.LongURL,
		IsCustom:     isCustom,
		RequiresAuth: r.RequiresAuth,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Protected links use the creator's account credentials
	if r.RequiresAuth {
		var user User
		if err := db.First(&user, *userID).Error; err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "Failed to load user")
		}
		link.AccessUsername = user.Username
		link.AccessPassword = user.Password // Already hashed
	}

	if err := db.Create(&link).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create link")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"surl":          r.BaseURL + "/" + code,
		"id":            link.ID,
		"code":          code,
		"long_url":      link.LongURL,
		"is_custom":     link.IsCustom,
		"requires_auth": link.RequiresAuth,
	})
}

// fetchLURL resolves a short code to a long URL
func fetchLURL(c echo.Context) error {
	code := c.Param("code")
	var link Link
	if err := db.Where("code = ?", code).First(&link).Error; err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Link not found")
	}

	if link.RequiresAuth {
		// Check if user is authenticated and is the link owner
		if userID, ok := c.Get("user_id").(uint); ok {
			if link.UserID != nil && *link.UserID == userID {
				// Auto-authorize link owner
				db.Model(&link).UpdateColumn("click_count", gorm.Expr("click_count + 1"))
				return c.JSON(http.StatusOK, map[string]interface{}{
					"lurl":            link.LongURL,
					"requires_auth":   false,
					"auto_authorized": true,
				})
			}
		}

		// User not logged in or not the owner - require manual auth
		return c.JSON(http.StatusOK, map[string]interface{}{
			"requires_auth": true,
			"code":          link.Code,
		})
	}

	db.Model(&link).UpdateColumn("click_count", gorm.Expr("click_count + 1"))

	return c.JSON(http.StatusOK, map[string]interface{}{
		"lurl":          link.LongURL,
		"requires_auth": false,
	})
}

// verifyAndRedirect checks credentials for auth-protected links
func verifyAndRedirect(c echo.Context) error {
	code := c.Param("code")

	type Req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	r := new(Req)
	if err := c.Bind(r); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	var link Link
	if err := db.Where("code = ?", code).First(&link).Error; err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Link not found")
	}

	if !link.RequiresAuth {
		db.Model(&link).UpdateColumn("click_count", gorm.Expr("click_count + 1"))
		return c.JSON(http.StatusOK, map[string]string{"lurl": link.LongURL})
	}

	if r.Username != link.AccessUsername {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
	}

	// Verify against the link owner's account password
	var user User
	if db.Where("username = ?", link.AccessUsername).First(&user).Error != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to verify credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(r.Password)); err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
	}

	db.Model(&link).UpdateColumn("click_count", gorm.Expr("click_count + 1"))
	return c.JSON(http.StatusOK, map[string]string{"lurl": link.LongURL})
}

// --- Dashboard handlers (authenticated) ---

func listLinks(c echo.Context) error {
	uid := c.Get("user_id").(uint)
	var links []Link
	if err := db.Where("user_id = ?", uid).Order("created_at desc").Find(&links).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to fetch links")
	}
	return c.JSON(http.StatusOK, links)
}

func updateLink(c echo.Context) error {
	uid := c.Get("user_id").(uint)
	id := c.Param("id")

	var link Link
	if err := db.First(&link, id).Error; err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Link not found")
	}
	if link.UserID == nil || *link.UserID != uid {
		return echo.NewHTTPError(http.StatusForbidden, "Access denied")
	}

	type Req struct {
		Code         *string `json:"code"`
		LongURL      *string `json:"long_url"`
		RequiresAuth *bool   `json:"requires_auth"`
	}

	r := new(Req)
	if err := c.Bind(r); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	if r.Code != nil {
		if len(*r.Code) < 2 || len(*r.Code) > 32 {
			return echo.NewHTTPError(http.StatusBadRequest, "Code must be 2–32 characters")
		}
		var dup Link
		if db.Where("code = ? AND id != ?", *r.Code, link.ID).First(&dup).Error == nil {
			return echo.NewHTTPError(http.StatusConflict, "Short code already taken")
		}
		link.Code = *r.Code
		link.IsCustom = true
	}

	if r.LongURL != nil {
		if *r.LongURL == "" {
			return echo.NewHTTPError(http.StatusBadRequest, "URL cannot be empty")
		}
		link.LongURL = *r.LongURL
	}

	if r.RequiresAuth != nil {
		if *r.RequiresAuth {
			// Enable protection with owner's credentials
			var user User
			if err := db.First(&user, uid).Error; err != nil {
				return echo.NewHTTPError(http.StatusInternalServerError, "Failed to load user")
			}
			link.RequiresAuth = true
			link.AccessUsername = user.Username
			link.AccessPassword = user.Password // Already hashed
		} else {
			// Disable protection
			link.RequiresAuth = false
			link.AccessUsername = ""
			link.AccessPassword = ""
		}
	}

	link.UpdatedAt = time.Now()
	if err := db.Save(&link).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to update link")
	}

	return c.JSON(http.StatusOK, link)
}

func deleteLink(c echo.Context) error {
	uid := c.Get("user_id").(uint)
	id := c.Param("id")

	var link Link
	if err := db.First(&link, id).Error; err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Link not found")
	}
	if link.UserID == nil || *link.UserID != uid {
		return echo.NewHTTPError(http.StatusForbidden, "Access denied")
	}

	if err := db.Delete(&link).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to delete link")
	}
	return c.JSON(http.StatusOK, map[string]string{"message": "Link deleted"})
}
