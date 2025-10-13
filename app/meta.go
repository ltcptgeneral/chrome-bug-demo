package app

// defines mime type and associated minifier
type MimeType struct {
	Type string
}

// debug mime types
var MimeTypes = map[string]MimeType{
	"css": {
		Type: "text/css",
	},
	"html": {
		Type: "text/html",
	},
	"tmpl": {
		Type: "text/plain",
	},
	"frag": {
		Type: "text/plain",
	},
	"svg": {
		Type: "image/svg+xml",
	},
	"js": {
		Type: "application/javascript",
	},
	"wasm": {
		Type: "application/wasm",
	},
	"*": {
		Type: "text/plain",
	},
}
