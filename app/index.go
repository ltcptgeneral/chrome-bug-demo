package app

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// used in constructing instance cards in index
type InstanceCard struct {
	VMID        uint
	Name        string
	Type        string
	Status      string
	Node        string
	NodeStatus  string
	ConfigPath  string
	ConsolePath string
	BackupsPath string
}

func HandleGETIndex(c *gin.Context) {
	c.HTML(http.StatusOK, "html/index.html", nil)
}
