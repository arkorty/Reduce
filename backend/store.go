package main

import (
	"fmt"
	"os"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/sqlite"
)

// User represents a registered account
type User struct {
	ID        uint      `gorm:"primary_key" json:"id"`
	Username  string    `gorm:"unique_index;not null;size:32" json:"username"`
	Password  string    `gorm:"not null" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Link represents a shortened URL
type Link struct {
	ID             uint      `gorm:"primary_key" json:"id"`
	UserID         *uint     `gorm:"index" json:"user_id"`
	Code           string    `gorm:"unique_index;not null;size:32" json:"code"`
	LongURL        string    `gorm:"not null;column:long_url" json:"long_url"`
	IsCustom       bool      `gorm:"default:false" json:"is_custom"`
	RequiresAuth   bool      `gorm:"default:false" json:"requires_auth"`
	AccessUsername string    `gorm:"column:access_username;size:64" json:"access_username,omitempty"`
	AccessPassword string    `gorm:"column:access_password" json:"-"`
	ClickCount     int       `gorm:"default:0" json:"click_count"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
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

	db.Exec("PRAGMA foreign_keys = ON")
	db.Exec("PRAGMA journal_mode = WAL")

	db.AutoMigrate(&User{}, &Link{})
}
