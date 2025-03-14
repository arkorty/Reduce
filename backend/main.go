package main

import (
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"
	"fmt"
	"errors"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
)

var db *gorm.DB

type URL struct {
	ID        string    `gorm:"primary_key" json:"id"`
	LongURL   string    `json:"long_url"`
	ShortURL  string    `json:"short_url"`
	CreatedAt time.Time `json:"created_at"`
}

func init() {
	var err error
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbName := os.Getenv("DB_NAME")
	dbPassword := os.Getenv("DB_PASSWORD")

	dsn := "host=" + dbHost + " port=" + dbPort + " user=" + dbUser + " dbname=" + dbName + " password=" + dbPassword + " sslmode=disable"

	maxRetries := 5
	retryDelay := 2 * time.Second

	for i := 0; i < maxRetries; i++ {
		db, err = gorm.Open("postgres", dsn)
		if err == nil {
			// Connection successful, break out of the loop
			break
		}

		// Log the error and wait before retrying
		fmt.Printf("Failed to connect to database (attempt %d/%d): %v\n", i+1, maxRetries, err)
		time.Sleep(retryDelay)
	}

	if err != nil {
		// Panic if the final attempt also fails
		panic(fmt.Sprintf("Failed to connect to database after %d attempts: %v", maxRetries, err))
	}

	// Auto-migrate database
	db.AutoMigrate(&URL{})
}

func generateRandomString(length int) string {
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
		LongURL string `json:"long_url"`
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
	var existingURL URL
	if err := db.Where("long_url = ?", reqBody.LongURL).First(&existingURL).Error; err == nil {
		// If the long URL exists, return the existing short URL
		return c.JSON(http.StatusOK, existingURL)
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		// If there's an error other than record not found, return an error
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to check existing URL")
	}

	// Generate a unique ID
	id := generateRandomString(6)

	// Create URL record
	url := &URL{
		ID:        id,
		LongURL:   reqBody.LongURL,
		ShortURL:  reqBody.BaseURL + "/" + id,
		CreatedAt: time.Now(),
	}

	// Save URL record to the database
	if err := db.Create(url).Error; err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create URL record")
	}

	return c.JSON(http.StatusCreated, url)
}

func fetchLongURL(c echo.Context) error {
	id := c.Param("id")
	var url URL
	if err := db.Where("id = ?", id).First(&url).Error; err != nil {
		log.Println("Error retrieving URL:", err)
		return echo.NewHTTPError(http.StatusNotFound, "URL not found")
	}
	return c.JSON(http.StatusOK, map[string]string{"long_url": url.LongURL})
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
	e.GET("/reduce/:id", fetchLongURL)

	e.Logger.Fatal(e.Start(":8080"))
}
