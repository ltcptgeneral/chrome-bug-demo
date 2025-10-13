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
	instances := map[uint]InstanceCard{}
	instances[200] = InstanceCard{
		VMID:        200,
		Name:        "example",
		Type:        "lxc",
		Status:      "running",
		Node:        "geigatron-2-pve",
		NodeStatus:  "online",
		ConfigPath:  "/",
		ConsolePath: "/",
		BackupsPath: "/",
	}

	page := gin.H{
		"global":    nil,
		"page":      "index",
		"instances": instances,
	}
	c.HTML(http.StatusOK, "html/index.html", page)
}
