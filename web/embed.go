package web

import (
	"embed"
)

//go:embed css/*
var CSS_fs embed.FS

//go:embed images/*
var Images_fs embed.FS

//go:embed scripts/*
var Scripts_fs embed.FS

//go:embed html/*
var Templates embed.FS
