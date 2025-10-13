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
	ServeStatic(router)
	html := LoadStatic(web.Templates)
	TMPL = LoadHTMLToGin(router, html)

	router.GET("/", HandleGETIndex)

	/*router.StaticFS("/css", http.Dir("./web/css"))
	router.StaticFS("/images", http.Dir("./web/images"))
	router.StaticFS("/modules", http.Dir("./web/modules"))
	router.StaticFS("/scripts", http.Dir("./web/scripts"))*/

	log.Fatal(router.Run("0.0.0.0:8080"))
}

func ServeStatic(router *gin.Engine) {
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
	modules := LoadStatic(web.Modules_fs)
	router.GET("/modules/*module", func(c *gin.Context) {
		path, _ := c.Params.Get("module")
		data := modules[fmt.Sprintf("modules%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
	scripts := LoadStatic(web.Scripts_fs)
	router.GET("/scripts/*script", func(c *gin.Context) {
		path, _ := c.Params.Get("script")
		data := scripts[fmt.Sprintf("scripts%s", path)]
		c.Data(200, data.MimeType.Type, []byte(data.Data))
	})
}
