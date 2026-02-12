package main

import (
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

func main() {
	godotenv.Load()
	defer db.Close()

	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Health
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Backend is running alright.\n")
	})

	// Auth
	e.POST("/auth/register", register)
	e.POST("/auth/login", login)
	e.GET("/auth/me", getMe, JWTMiddleware)

	// Public link routes (optional auth for shorten)
	e.POST("/reduce/shorten", shortenURL, OptionalJWTMiddleware)
	e.GET("/reduce/:code", fetchLURL)
	e.POST("/reduce/:code/verify", verifyAndRedirect)

	// Authenticated link management
	links := e.Group("/links", JWTMiddleware)
	links.GET("", listLinks)
	links.PUT("/:id", updateLink)
	links.DELETE("/:id", deleteLink)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}
