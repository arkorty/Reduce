package main

import (
	"log"
	"math/rand"
	"net/http"
	"time"
	"os"
	"errors"
	"strconv"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func codegen(length int) string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	bytes := make([]byte, length)
	for i := range bytes {
		bytes[i] = charset[rand.Intn(len(charset))]
	}
	return string(bytes)
}

func shortenURL(c echo.Context) error {
	// Define a struct for binding the request body
	type RequestBody struct {
		LURL string `json:"lurl"`
		BaseURL string `json:"base_url"` // Expect base URL in the request
	}

	// Bind request body to the RequestBody struct
	reqBody := new(RequestBody)
	if err := c.Bind(reqBody); err != nil {
		return err
	}

	// Validate the base URL
	if reqBody.BaseURL == "" {
		// Fallback to BASE_URL environment variable
		reqBody.BaseURL = os.Getenv("BASE_URL")
		if reqBody.BaseURL == "" {
			return echo.NewHTTPError(http.StatusInternalServerError, "Base URL is not configured")
		}
	}

	// Check if the long URL already exists in the database
	var existingURL CodeURLMap
	if err := db.Where("lurl = ?", reqBody.LURL).First(&existingURL).Error; err == nil {
		// If the long URL exists, return the existing short URL
		return c.JSON(http.StatusOK, map[string]string{
			"surl": reqBody.BaseURL + "/" + existingURL.Code,
		})
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// If there's an error other than record not found, return an error
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to check existing URL")
	}

	// Generate a unique code
	codelen := 6
	if os.Getenv("CODE_LENGTH") != "" && os.Getenv("CODE_LENGTH") != "0" {
		t, err := strconv.Atoi(os.Getenv("CODE_LENGTH"))
		if err == nil {
			codelen = t
		}
	}
	code := codegen(codelen)

	// Create URL record
	url := &CodeURLMap{
		Code:        code,
		LURL:   reqBody.LURL,
		CreatedAt: time.Now(),
	}

	// Save URL record to the database
	if err := db.Create(url).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create URL record")
	}

	return c.JSON(http.StatusCreated, map[string]string{
		"surl": reqBody.BaseURL + "/" + code,
	})
}

func fetchLURL(c echo.Context) error {
	code := c.Param("code")
	var url CodeURLMap
	if err := db.Where("code = ?", code).First(&url).Error; err != nil {
		log.Println("Error retrieving URL:", err)
		return echo.NewHTTPError(http.StatusNotFound, "URL not found")
	}
	return c.JSON(http.StatusOK, map[string]string{"lurl": url.LURL})
}


func main() {
	defer db.Close()

	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
	}))

	// Routes
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Backend is running alright.\n")
	})

	e.POST("/reduce/shorten", shortenURL)
	e.GET("/reduce/:code", fetchLURL)

	e.Logger.Fatal(e.Start(":8080"))
}
