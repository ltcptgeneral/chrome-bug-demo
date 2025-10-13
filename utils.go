package main

import (
	"embed"
	"errors"
	"html/template"
	"io/fs"
	"log"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
)

var TMPL *template.Template

type StaticFile struct {
	Data     string
	MimeType MimeType
}

func LoadStatic(files embed.FS) map[string]StaticFile {
	minified := make(map[string]StaticFile)

	fs.WalkDir(files, ".", func(path string, entry fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if !entry.IsDir() {
			v, err := files.ReadFile(path)
			if err != nil {
				log.Fatalf("error parsing template file %s: %s", path, err.Error())
			}
			x := strings.Split(entry.Name(), ".")
			if len(x) >= 2 { // file has extension
				mimetype := MimeTypes[x[len(x)-1]]
				minified[path] = StaticFile{
					Data:     string(v),
					MimeType: mimetype,
				}
			} else { // if the file has no extension, skip minify
				mimetype := MimeTypes["*"]
				minified[path] = StaticFile{
					Data:     string(v),
					MimeType: mimetype,
				}
			}
		}
		return nil
	})
	return minified
}

func LoadHTMLToGin(engine *gin.Engine, html map[string]StaticFile) *template.Template {
	root := template.New("")
	engine.FuncMap = template.FuncMap{
		"MapKeys": func(x any, sep string) string {
			v := reflect.ValueOf(x)
			keys := v.MapKeys()
			s := ""
			for i := 0; i < len(keys); i++ {
				if i != 0 {
					s += sep
				}
				s += keys[i].String()
			}
			return s
		},
		"Map": func(values ...any) (map[string]any, error) {
			if len(values)%2 != 0 {
				return nil, errors.New("invalid dict call")
			}
			dict := make(map[string]interface{}, len(values)/2)
			for i := 0; i < len(values); i += 2 {
				key, ok := values[i].(string)
				if !ok {
					return nil, errors.New("dict keys must be strings")
				}
				dict[key] = values[i+1]
			}
			return dict, nil
		},
	}
	tmpl := template.Must(root, LoadAndAddToRoot(engine.FuncMap, root, html))
	engine.SetHTMLTemplate(tmpl)
	return tmpl
}

func LoadAndAddToRoot(FuncMap template.FuncMap, root *template.Template, html map[string]StaticFile) error {
	for name, file := range html {
		t := root.New(name).Funcs(FuncMap)
		_, err := t.Parse(file.Data)
		if err != nil {
			return err
		}
	}
	return nil
}
