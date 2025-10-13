window.addEventListener("DOMContentLoaded", init);

async function init () {
	document.querySelector("#randomize").addEventListener("click", randomize);
	document.querySelectorAll("custom-element").forEach((e) => {
		e.number = Math.random();
		e.id = window.crypto.randomUUID();
		e.update();
	})
}

class CustomElement extends HTMLElement {
	shadowRoot = null;

	constructor () {
		super();
		const internals = this.attachInternals();
		this.shadowRoot = internals.shadowRoot;
	}

	get id () {
		return this.dataset.id;
	}

	set id (id) {
		this.dataset.id = id;
	}

	get number () {
		return this.dataset.number;
	}

	set number (number) {
		this.dataset.number = number;
	}

	update () {
		this.shadowRoot.querySelector("#id").innerText = this.id;
		this.shadowRoot.querySelector("#number").innerText = this.number;
	}
}

customElements.define("custom-element", CustomElement);

function randomize () {
	const container = document.querySelector("#container");
	document.querySelectorAll("custom-element").forEach((e) => {
		container.appendChild(e);
	})
}