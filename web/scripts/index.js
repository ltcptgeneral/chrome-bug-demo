import { requestPVE, requestAPI, setAppearance, getSearchSettings, requestDash, setSVGSrc, setSVGAlt } from "./utils.js";
import { alert, dialog } from "./dialog.js";

window.addEventListener("DOMContentLoaded", init);

async function init () {
	initInstances();
	document.querySelector("#vm-search").addEventListener("input", sortInstances);
}

class InstanceCard extends HTMLElement {
	actionLock = false;
	shadowRoot = null;

	constructor () {
		super();
		const internals = this.attachInternals();
		this.shadowRoot = internals.shadowRoot;
		this.actionLock = false;
	}

	get type () {
		return this.dataset.type;
	}

	set type (type) {
		this.dataset.type = type;
	}

	get status () {
		return this.dataset.status;
	}

	set status (status) {
		this.dataset.status = status;
	}

	get vmid () {
		return this.dataset.vmid;
	}

	set vmid (vmid) {
		this.dataset.vmid = vmid;
	}

	get name () {
		return this.dataset.name;
	}

	set name (name) {
		this.dataset.name = name;
	}

	get node () {
		return {
			name: this.dataset.node,
			status: this.dataset.nodestatus
		};
	}

	set node (node) {
		this.dataset.node = node.name;
		this.dataset.nodetsatus = node.status;
	}

	set searchQueryResult (result) {
		this.dataset.searchqueryresult = JSON.stringify(result);
	}

	get searchQueryResult () {
		return JSON.parse(!this.dataset.searchqueryresult ? "{}" : this.dataset.searchqueryresult);
	}

	update () {
		const nameParagraph = this.shadowRoot.querySelector("#instance-name");
		nameParagraph.innerText = "";
		if (this.searchQueryResult.alignment) {
			let i = 0; // name index
			let c = 0; // alignment index
			const alignment = this.searchQueryResult.alignment;
			while (i < this.name.length && c < alignment.length) {
				if (alignment[c] === "M") {
					const part = document.createElement("span");
					part.innerText = this.name[i];
					part.style = "color: var(--lightbg-text-color); background-color: var(--highlight-color);";
					nameParagraph.append(part);
					i++;
					c++;
				}
				else if (alignment[c] === "I") {
					const part = document.createElement("span");
					part.innerText = this.name[i];
					nameParagraph.append(part);
					i++;
					c++;
				}
				else if (alignment[c] === "D") {
					c++;
				}
				else if (alignment[c] === "X") {
					const part = document.createElement("span");
					part.innerText = this.name[i];
					nameParagraph.append(part);
					i++;
					c++;
				}
			}
		}
		else {
			nameParagraph.innerHTML = this.name ? this.name : "&nbsp;";
		}

		const powerButton = this.shadowRoot.querySelector("#power-btn");
		if (powerButton.classList.contains("clickable")) {
			powerButton.onclick = this.handlePowerButton.bind(this);
			powerButton.onkeydown = (event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					this.handlePowerButton();
				}
			};
		}

		const deleteButton = this.shadowRoot.querySelector("#delete-btn");
		if (deleteButton.classList.contains("clickable")) {
			deleteButton.onclick = this.handleDeleteButton.bind(this);
			deleteButton.onkeydown = (event) => {
				if (event.key === "Enter") {
					event.preventDefault();
					this.handleDeleteButton();
				}
			};
		}
	}

	setStatusLoading () {
		this.status = "loading";
		const statusicon = this.shadowRoot.querySelector("#status");
		const powerbtn = this.shadowRoot.querySelector("#power-btn");
		setSVGSrc(statusicon, "images/status/loading.svg");
		setSVGAlt(statusicon, "instance is loading");
		setSVGSrc(powerbtn, "images/status/loading.svg");
		setSVGAlt(powerbtn, "");
	}

	async handlePowerButton () {
		if (!this.actionLock) {
			const template = this.shadowRoot.querySelector("#power-dialog");
			dialog(template, async (result, form) => {
				if (result === "confirm") {
					this.actionLock = true;
					const targetAction = this.status === "running" ? "stop" : "start";

					const result = await requestPVE(`/nodes/${this.node.name}/${this.type}/${this.vmid}/status/${targetAction}`, "POST", { node: this.node.name, vmid: this.vmid });
					this.setStatusLoading();

					const waitFor = delay => new Promise(resolve => setTimeout(resolve, delay));

					while (true) {
						const taskStatus = await requestPVE(`/nodes/${this.node.name}/tasks/${result.data}/status`, "GET");
						if (taskStatus.data.status === "stopped" && taskStatus.data.exitstatus === "OK") { // task stopped and was successful
							break;
						}
						else if (taskStatus.data.status === "stopped") { // task stopped but was not successful
							alert(`Attempted to ${targetAction} ${this.vmid} but got: ${taskStatus.data.exitstatus}`);
							break;
						}
						else { // task has not stopped
							await waitFor(1000);
						}
					}

					this.actionLock = false;
					refreshInstances();
				}
			});
		}
	}

	handleDeleteButton () {
		if (!this.actionLock && this.status === "stopped") {
			const template = this.shadowRoot.querySelector("#delete-dialog");
			dialog(template, async (result, form) => {
				if (result === "confirm") {
					this.actionLock = true;

					const action = {};
					action.purge = 1;
					action["destroy-unreferenced-disks"] = 1;

					const result = await requestAPI(`/cluster/${this.node.name}/${this.type}/${this.vmid}/delete`, "DELETE");
					if (result.status !== 200) {
						alert(`Attempted to delete ${this.vmid} but got: ${result.error}`);
					}

					this.actionLock = false;
					refreshInstances();
				}
			});
		}
	}
}

customElements.define("instance-card", InstanceCard);

async function getInstancesFragment () {
	return await requestDash("/index/instances", "GET");
}

async function refreshInstances () {
	let instances = await getInstancesFragment();
	if (instances.status !== 200) {
		alert(`Error fetching instances: ${instances.status} ${instances.error != undefined ? instances.error : ""}`);
	}
	else {
		instances = instances.data;
		const container = document.querySelector("#instance-container");
		container.setHTMLUnsafe(instances);
		sortInstances();
	}
}

function initInstances () {
	const container = document.querySelector("#instance-container");
	let instances = container.children;
	instances = [].slice.call(instances);
	for (let i = 0; i < instances.length; i++) {
		instances[i].update();
	}
}

function sortInstances () {
	const searchCriteria = "exact";
	const searchQuery = document.querySelector("#search").value || null;
	let criteria;
	if (!searchQuery) {
		criteria = (item, query = null) => {
			return { score: item.vmid, alignment: null };
		};
	}
	else if (searchCriteria === "exact") {
		criteria = (item, query) => {
			const substrInc = item.includes(query);
			if (substrInc) {
				const substrStartIndex = item.indexOf(query);
				const queryLength = query.length;
				const remaining = item.length - substrInc - queryLength + 1;
				const alignment = `${"X".repeat(substrStartIndex)}${"M".repeat(queryLength)}${"X".repeat(remaining)}`;
				return { score: -1, alignment };
			}
			else {
				const alignment = `${"X".repeat(item.length)}`;
				return { score: 0, alignment };
			}
		};
	}
	else if (searchCriteria === "fuzzy") {
		const penalties = {
			m: 0,
			x: 1,
			o: 0,
			e: 1
		};
		criteria = (item, query) => {
			// lower is better
			const { score, CIGAR } = global.wfa.wfAlign(query, item, penalties, true);
			const alignment = global.wfa.DecodeCIGAR(CIGAR);
			return { score: score / item.length, alignment };
		};
	}

	const container = document.querySelector("#instance-container");
	let instances = container.children;
	instances = [].slice.call(instances);

	for (let i = 0; i < instances.length; i++) {
		if (!instances[i].dataset.name) { // if the instance has no name, assume its just empty string
			instances[i].dataset.name = "";
		}
		const { score, alignment } = criteria(instances[i].dataset.name.toLowerCase(), searchQuery ? searchQuery.toLowerCase() : "");
		instances[i].searchQueryResult = { score, alignment };
	}
	const sortCriteria = (a, b) => {
		const aScore = a.searchQueryResult.score;
		const bScore = b.searchQueryResult.score;
		if (aScore === bScore) {
			return a.vmid > b.vmid ? 1 : -1;
		}
		else {
			return aScore - bScore;
		}
	};

	instances.sort(sortCriteria);

	for (let i = 0; i < instances.length; i++) {
		container.appendChild(instances[i]);
		instances[i].update();
	}
}
