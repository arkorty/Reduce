package main

import (
	"fmt"
	"time"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"

	"os"
)

type CodeURLMap struct {
	Code      string    `gorm:"primary_key" json:"code"`
	LURL      string    `json:"lurl" gorm:"column:lurl"`
	CreatedAt time.Time `json:"created_at"`
}

var db *gorm.DB

func init() {
	var err error
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "reduce.db"
	}

	db, err = gorm.Open("sqlite3", dbPath)
	if err != nil {
		panic(fmt.Sprintf("Failed to connect to database: %v", err))
	}

	// Auto-migrate database
	db.AutoMigrate(&CodeURLMap{})
}
