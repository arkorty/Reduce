package main

import (
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/labstack/echo"
	"golang.org/x/crypto/bcrypt"
)

// JWTClaims holds the JWT token claims
type JWTClaims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.StandardClaims
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "default-dev-secret-change-in-production"
	}
	return []byte(secret)
}

func generateToken(user *User) (string, error) {
	claims := &JWTClaims{
		UserID:   user.ID,
		Username: user.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: time.Now().Add(72 * time.Hour).Unix(),
			IssuedAt:  time.Now().Unix(),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(getJWTSecret())
}

func parseToken(tokenStr string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JWTClaims{}, func(t *jwt.Token) (interface{}, error) {
		return getJWTSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}

// JWTMiddleware requires a valid JWT token
func JWTMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			return echo.NewHTTPError(http.StatusUnauthorized, "Missing or invalid token")
		}
		claims, err := parseToken(strings.TrimPrefix(auth, "Bearer "))
		if err != nil {
			return echo.NewHTTPError(http.StatusUnauthorized, "Invalid or expired token")
		}
		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		return next(c)
	}
}

// OptionalJWTMiddleware extracts user if token present, doesn't require it
func OptionalJWTMiddleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		auth := c.Request().Header.Get("Authorization")
		if auth != "" && strings.HasPrefix(auth, "Bearer ") {
			if claims, err := parseToken(strings.TrimPrefix(auth, "Bearer ")); err == nil {
				c.Set("user_id", claims.UserID)
				c.Set("username", claims.Username)
			}
		}
		return next(c)
	}
}

func register(c echo.Context) error {
	type Req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	r := new(Req)
	if err := c.Bind(r); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	r.Username = strings.TrimSpace(r.Username)
	if len(r.Username) < 3 || len(r.Username) > 32 {
		return echo.NewHTTPError(http.StatusBadRequest, "Username must be 3–32 characters")
	}
	if len(r.Password) < 6 {
		return echo.NewHTTPError(http.StatusBadRequest, "Password must be at least 6 characters")
	}

	var existing User
	if db.Where("username = ?", r.Username).First(&existing).Error == nil {
		return echo.NewHTTPError(http.StatusConflict, "Username already taken")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(r.Password), bcrypt.DefaultCost)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to process password")
	}

	user := User{Username: r.Username, Password: string(hash)}
	if err := db.Create(&user).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create user")
	}

	token, err := generateToken(&user)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate token")
	}

	return c.JSON(http.StatusCreated, map[string]interface{}{
		"token": token,
		"user":  map[string]interface{}{"id": user.ID, "username": user.Username},
	})
}

func login(c echo.Context) error {
	type Req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	r := new(Req)
	if err := c.Bind(r); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request")
	}

	var user User
	if err := db.Where("username = ?", r.Username).First(&user).Error; err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(r.Password)); err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "Invalid credentials")
	}

	token, err := generateToken(&user)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to generate token")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"token": token,
		"user":  map[string]interface{}{"id": user.ID, "username": user.Username},
	})
}

func getMe(c echo.Context) error {
	uid := c.Get("user_id").(uint)
	var user User
	if err := db.First(&user, uid).Error; err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "User not found")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{
		"id":       user.ID,
		"username": user.Username,
	})
}
