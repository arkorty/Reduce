package main

import (
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

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
	db, err = gorm.Open("postgres", dsn)
	if err != nil {
		panic(err)
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
	url := new(URL)
	if err := c.Bind(url); err != nil {
		return err
	}
	url.CreatedAt = time.Now()
	url.ID = generateRandomString(6)
	url.ShortURL = "http://localhost:3000/" + url.ID
	db.Create(url)
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

	e.POST("/shorten", shortenURL)
	e.GET("/:id", fetchLongURL)

	e.Logger.Fatal(e.Start(":8080"))
}
