package app

import (
	"fmt"
	"log"
	"proxmoxaas-dashboard/dist/web" // go will complain here until the first build

	"github.com/gin-gonic/gin"
)

func Run(configPath *string) {
	gin.SetMode(gin.ReleaseMode)
	router := gin.Default()
	//ServeStaticFixed(router)
	ServeStaticBugged(router)
	html := LoadStatic(web.Templates)
	TMPL = LoadHTMLToGin(router, html)

	router.GET("/", HandleGETIndex)

	log.Fatal(router.Run("0.0.0.0:8080"))
}

func ServeStaticBugged(router *gin.Engine) {
	css := LoadStatic(web.CSS_fs)
	router.GET("/css/*css", func(c *gin.Context) {
		path, _ := c.Params.Get("css")
		data := css[fmt.Sprintf("css%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
	images := LoadStatic(web.Images_fs)
	router.GET("/images/*image", func(c *gin.Context) {
		path, _ := c.Params.Get("image")
		data := images[fmt.Sprintf("images%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
	scripts := LoadStatic(web.Scripts_fs)
	router.GET("/scripts/*script", func(c *gin.Context) {
		path, _ := c.Params.Get("script")
		data := scripts[fmt.Sprintf("scripts%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
}

func ServeStaticFixed(router *gin.Engine) {
	css := LoadStatic(web.CSS_fs)
	router.GET("/css/*css", func(c *gin.Context) {
		path, _ := c.Params.Get("css")
		data := css[fmt.Sprintf("css%s", path)]
		// this header fixes the issue
		c.Header("Last-Modified", "Mon, 13 Oct 2025 22:09:28 GMT")
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
	images := LoadStatic(web.Images_fs)
	router.GET("/images/*image", func(c *gin.Context) {
		path, _ := c.Params.Get("image")
		data := images[fmt.Sprintf("images%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
	scripts := LoadStatic(web.Scripts_fs)
	router.GET("/scripts/*script", func(c *gin.Context) {
		path, _ := c.Params.Get("script")
		data := scripts[fmt.Sprintf("scripts%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
}
