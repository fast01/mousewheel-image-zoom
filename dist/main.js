/*
THIS IS A GENERATED/BUNDLED FILE BY ROLLUP
if you want to view the source visit the plugins github repository
*/

'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

var ModifierKey;
(function (ModifierKey) {
    ModifierKey["ALT"] = "AltLeft";
    ModifierKey["CTRL"] = "ControlLeft";
    ModifierKey["SHIFT"] = "ShiftLeft";
})(ModifierKey || (ModifierKey = {}));
const DEFAULT_SETTINGS = {
    modifierKey: ModifierKey.ALT,
    stepSize: 25,
    initialSize: 500
};
/**
 * ReplaceTerm enables us to store the parameters for a replacement to add a new size parameter.
 */
class ReplaceTerm {
    constructor(replaceFrom, replaceWith) {
        this.replaceFrom = replaceFrom;
        this.replaceWith = replaceWith;
    }
    getReplaceFromString(oldSize) {
        return this.replaceFrom(oldSize);
    }
    getReplaceWithString(newSize) {
        return this.replaceWith(newSize);
    }
}
class MouseWheelZoomPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.isKeyHeldDown = false;
        this.wheelOpt = { passive: false };
        this.wheelEvent = 'wheel';
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.registerDomEvent(document, "keydown", (evt) => {
                if (evt.code === this.settings.modifierKey.toString()) {
                    this.isKeyHeldDown = true;
                    this.disableScroll();
                }
            });
            this.registerDomEvent(document, "keyup", (evt) => {
                if (evt.code === this.settings.modifierKey.toString()) {
                    this.onConfigKeyUp();
                }
            });
            this.registerDomEvent(document, "wheel", (evt) => {
                if (this.isKeyHeldDown) {
                    // When for example using Alt + Tab to switch between windows, the key is still recognized as held down.
                    // We check if the key is really held down by checking if the key is still pressed in the event when the
                    // wheel event is triggered.
                    if (!this.isConfiguredKeyDown(evt)) {
                        this.onConfigKeyUp();
                        return;
                    }
                    const eventTarget = evt.target;
                    if (eventTarget.nodeName === "IMG") {
                        // Handle the zooming of the image
                        this.handleZoom(evt, eventTarget);
                    }
                }
            });
            this.addSettingTab(new MouseWheelZoomSettingsTab(this.app, this));
            console.log("Loaded: Mousewheel image zoom");
        });
    }
    /**
     * When the config key is released, we enable the scroll again and reset the key held down flag.
     */
    onConfigKeyUp() {
        this.isKeyHeldDown = false;
        this.enableScroll();
    }
    onunload() {
        // Re-enable the normal scrolling behaviour when the plugin unloads
        this.enableScroll();
    }
    /**
     * Handles zooming with the mousewheel on an image
     * @param evt wheel event
     * @param eventTarget targeted image element
     * @private
     */
    handleZoom(evt, eventTarget) {
        console.log("handleZoom: Mousewheel image zoom");
        return __awaiter(this, void 0, void 0, function* () {
            const imageUri = eventTarget.attributes.getNamedItem("src").textContent;
            const parent = eventTarget.parentElement;
            const activeFile = yield this.getActivePaneWithImage(eventTarget);
            let fileText = yield this.app.vault.read(activeFile);
            const originalFileText = fileText;
            // Get paremeters like the regex or the replacement terms based on the fact if the image is locally stored or not.
            const zoomParams = this.getZoomParams(imageUri, fileText, parent);
            // Check if there is already a size parameter for this image.
            const sizeMatches = fileText.match(zoomParams.sizeMatchRegExp);
            //console.log("sizeMatches==null:", sizeMatches==null, " zoomParams:", zoomParams, parent);
            // Element already has a size entry
            if (sizeMatches !== null) {
                const oldSize = parseInt(sizeMatches[1]);
                let newSize = oldSize;
                if (evt.deltaY < 0) {
                    newSize += this.settings.stepSize;
                }
                else if (evt.deltaY > 0 && newSize > this.settings.stepSize) {
                    newSize -= this.settings.stepSize;
                }
                fileText = fileText.replace(zoomParams.replaceSizeExist.getReplaceFromString(oldSize), zoomParams.replaceSizeExist.getReplaceWithString(newSize));
            }
            else { // Element has no size entry -> give it an initial size
                const initialSize = this.settings.initialSize;
                fileText = fileText.replace(zoomParams.replaceSizeNotExist.getReplaceFromString(0), zoomParams.replaceSizeNotExist.getReplaceWithString(initialSize));
            }
            // Save changed size
            if (fileText !== originalFileText) {
                yield this.app.vault.modify(activeFile, fileText);
            }
        });
    }
    /**
     * Loop through all panes and get the pane that hosts a markdown file with the image to zoom
     * @param imageElement The HTML Element of the image
     * @private
     */
    getActivePaneWithImage(imageElement) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(((resolve, reject) => {
                this.app.workspace.iterateAllLeaves(leaf => {
                    if (leaf.view.containerEl.contains(imageElement) && leaf.view instanceof obsidian.MarkdownView) {
                        resolve(leaf.view.file);
                    }
                });
                reject(new Error("No file belonging to the image found"));
            }));
        });
    }
    /**
     * For a given file content decide if a string is inside a table
     * @param searchString string
     * @param fileValue file content
     * @private
     */
    static isInTable(searchString, fileValue) {
        return fileValue.search(new RegExp(`^\\|.+${searchString}.+\\|$`, "m")) !== -1;
    }
    /**
     * Get the image name from a given src uri
     * @param imageUri uri of the image
     * @private
     */
    static getImageNameFromUri(imageUri) {
        imageUri = decodeURI(imageUri);
        let imageName = imageUri.match(/([\w\d\s\.]+)\?/)[1];
        // Handle linux not correctly decoding the %2F before the Filename to a \
        if (imageName.substr(0, 2) === "2F") {
            imageName = imageName.slice(2);
        }
        return imageName;
    }
    getZoomParams(imageUri, fileText, parent) {
        if (imageUri.contains("http")) {
            console.log("remote imageUri: ", imageUri);
            return this.getRemoteImageZoomParams(imageUri, fileText);
        }
        else if (imageUri.contains("app://local")) {
            const imageName = MouseWheelZoomPlugin.getImageNameFromUri(imageUri);
            //return this.getLocalImageZoomParams(imageName, fileText);
            const orig_url =  parent.attributes.getNamedItem("src").textContent;            
            const imgFormatMatchRegExp = new RegExp(`\\[\\[${escapeRegex(orig_url)}`);
            const imgFormatMatchResult = fileText.match(imgFormatMatchRegExp);
            console.log("local full imageUri: ", imageUri, imageName, " orig:", orig_url);
            //console.log("imgFormatMatchRegExp, imgFormatMatchResult");
            if (imgFormatMatchResult === null) {
               return this.getRemoteImageZoomParams(orig_url, fileText);            
           }
            else {
                 // if image type is  ![[ xxx.img ]], use this 
                return this.getLocalImageZoomParams(orig_url, fileText);                
            }
        }
        else if (parent.classList.value.match("excalidraw-svg.*")) {
            const src = parent.attributes.getNamedItem("src").textContent;
            // remove ".md" from the end of the src
            const imageName = src.substring(0, src.length - 3);
            // Only get text after "/"
            const imageNameAfterSlash = imageName.substring(imageName.lastIndexOf("/") + 1);
            return this.getLocalImageZoomParams(imageNameAfterSlash, fileText);
        }
        throw new Error("Image is not zoomable");
    }
    /**
     * Get the parameters needed to handle the zoom for a remote image
     * @param imageUri URI of the image
     * @param fileText content of the current file
     * @returns parameters to handle the zoom
     */
    getRemoteImageZoomParams(imageUri, fileText) {
        const isInTable = MouseWheelZoomPlugin.isInTable(imageUri, fileText);
        // Separator to use for the replacement
        const sizeSeparator = isInTable ? "\\|" : "|";
        // Separator to use for the regex: isInTable ? \\\| : \|
        const regexSeparator = isInTable ? "\\\\\\|" : "\\|";
        const sizeMatchRegExp = new RegExp(`${regexSeparator}(\\d+)]${escapeRegex("(" + imageUri + ")")}`);
        const replaceSizeExistFrom = (oldSize) => `${sizeSeparator}${oldSize}](${imageUri})`;
        const replaceSizeExistWith = (newSize) => `${sizeSeparator}${newSize}](${imageUri})`;
        const replaceSizeNotExistsFrom = (oldSize) => `](${imageUri})`;
        const replaceSizeNotExistsWith = (newSize) => `${sizeSeparator}${newSize}](${imageUri})`;
        const replaceSizeExist = new ReplaceTerm(replaceSizeExistFrom, replaceSizeExistWith);
        const replaceSizeNotExist = new ReplaceTerm(replaceSizeNotExistsFrom, replaceSizeNotExistsWith);
        //console.log("remote image zoom params: ", imageUri);
        return {
            sizeMatchRegExp: sizeMatchRegExp,
            replaceSizeExist: replaceSizeExist,
            replaceSizeNotExist: replaceSizeNotExist,
        };
    }
    /**
     * Get the parameters needed to handle the zoom for a local image
     * @param imageName Name of the image
     * @param fileText content of the current file
     * @returns parameters to handle the zoom
     * @note  this local file only match format ![[ abcdeft.img ]] !
     */
    getLocalImageZoomParams(imageName, fileText) {
        const isInTable = MouseWheelZoomPlugin.isInTable(imageName, fileText);
        // Separator to use for the replacement
        const sizeSeparator = isInTable ? "\\|" : "|";
        // Separator to use for the regex: isInTable ? \\\| : \|
        const regexSeparator = isInTable ? "\\\\\\|" : "\\|";
        /*  // orignal
        // If after the imageName in filetext follows a "|" then it means that the image is already zoomed
        const imageNamePosition = fileText.indexOf(imageName);
        const stringAfterFileName = fileText.substring(imageNamePosition + imageName.length);
        // Handle the case where behind the imageName there are more attributes like |ctr for ITS Theme by attaching them to the imageName
        const regExpMatchArray = stringAfterFileName.match(/([^\]]*?)\\?\|\d+]]|([^\]]*?)]]|/);
        if (regExpMatchArray) {
            if (!!regExpMatchArray[1]) {
                imageName += regExpMatchArray[1];
            }
            else if (!!regExpMatchArray[2]) {
                imageName += regExpMatchArray[2];
            }
        }
        */

        const sizeMatchRegExp = new RegExp(`\\[\\[${escapeRegex(imageName)}${regexSeparator}(\\d+)`);
        const replaceSizeExistFrom = (oldSize) => `\[\[${imageName}${sizeSeparator}${oldSize}`;
        const replaceSizeExistWith = (newSize) => `\[\[${imageName}${sizeSeparator}${newSize}`;
        const replaceSizeNotExistsFrom = (oldSize) => `\[\[${imageName}`;
        const replaceSizeNotExistsWith = (newSize) => `\[\[${imageName}${sizeSeparator}${newSize}`;
        const replaceSizeExist = new ReplaceTerm(replaceSizeExistFrom, replaceSizeExistWith);
        const replaceSizeNotExist = new ReplaceTerm(replaceSizeNotExistsFrom, replaceSizeNotExistsWith);
        //console.log("local image zoom params: ", imageName);
        return {
            sizeMatchRegExp: sizeMatchRegExp,
            replaceSizeExist: replaceSizeExist,
            replaceSizeNotExist: replaceSizeNotExist,
        };
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    // Utilities to disable and enable scrolling //
    preventDefault(e) {
        e.preventDefault();
    }
    /**
     * Disables the normal scroll event
     */
    disableScroll() {
        window.addEventListener(this.wheelEvent, this.preventDefault, this.wheelOpt);
    }
    /**
     * Enables the normal scroll event
     */
    enableScroll() {
        window.removeEventListener(this.wheelEvent, this.preventDefault, this.wheelOpt);
    }
    isConfiguredKeyDown(evt) {
        switch (this.settings.modifierKey) {
            case ModifierKey.ALT:
                return evt.altKey;
            case ModifierKey.CTRL:
                return evt.ctrlKey;
            case ModifierKey.SHIFT:
                return evt.shiftKey;
        }
    }
}
class MouseWheelZoomSettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'Settings for mousewheel zoom' });
        new obsidian.Setting(containerEl)
            .setName('Trigger Key')
            .setDesc('Key that needs to be pressed down for mousewheel zoom to work.')
            .addDropdown(dropdown => dropdown
            .addOption(ModifierKey.CTRL, "Ctrl")
            .addOption(ModifierKey.ALT, "Alt")
            .addOption(ModifierKey.SHIFT, "Shift")
            .setValue(this.plugin.settings.modifierKey)
            .onChange((value) => __awaiter(this, void 0, void 0, function* () {
            this.plugin.settings.modifierKey = value;
            yield this.plugin.saveSettings();
        })));
        new obsidian.Setting(containerEl)
            .setName('Step size')
            .setDesc('Step value by which the size of the image should be increased/decreased')
            .addSlider(slider => {
            slider
                .setValue(25)
                .setLimits(0, 100, 1)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.stepSize)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.stepSize = value;
                yield this.plugin.saveSettings();
            }));
        });
        new obsidian.Setting(containerEl)
            .setName('Initial Size')
            .setDesc('Initial image size if no size was defined beforehand')
            .addSlider(slider => {
            slider
                .setValue(500)
                .setLimits(0, 1000, 25)
                .setDynamicTooltip()
                .setValue(this.plugin.settings.stepSize)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.initialSize = value;
                yield this.plugin.saveSettings();
            }));
        });
    }
}
/**
 * Function to escape a string into a valid searchable string for a regex
 * @param string string to escape
 * @returns escaped string
 */
function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

module.exports = MouseWheelZoomPlugin;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOlsibm9kZV9tb2R1bGVzL3RzbGliL3RzbGliLmVzNi5qcyIsIm1haW4udHMiXSwic291cmNlc0NvbnRlbnQiOm51bGwsIm5hbWVzIjpbIlBsdWdpbiIsIk1hcmtkb3duVmlldyIsIlBsdWdpblNldHRpbmdUYWIiLCJTZXR0aW5nIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBdURBO0FBQ08sU0FBUyxTQUFTLENBQUMsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFO0FBQzdELElBQUksU0FBUyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsT0FBTyxLQUFLLFlBQVksQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLE9BQU8sRUFBRSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ2hILElBQUksT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsVUFBVSxPQUFPLEVBQUUsTUFBTSxFQUFFO0FBQy9ELFFBQVEsU0FBUyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtBQUNuRyxRQUFRLFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtBQUN0RyxRQUFRLFNBQVMsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUMsRUFBRTtBQUN0SCxRQUFRLElBQUksQ0FBQyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxVQUFVLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUM5RSxLQUFLLENBQUMsQ0FBQztBQUNQOztBQy9EQSxJQUFLLFdBSUo7QUFKRCxXQUFLLFdBQVc7SUFDWiw4QkFBZSxDQUFBO0lBQ2YsbUNBQW9CLENBQUE7SUFDcEIsa0NBQW1CLENBQUE7QUFDdkIsQ0FBQyxFQUpJLFdBQVcsS0FBWCxXQUFXLFFBSWY7QUFFRCxNQUFNLGdCQUFnQixHQUEyQjtJQUM3QyxXQUFXLEVBQUUsV0FBVyxDQUFDLEdBQUc7SUFDNUIsUUFBUSxFQUFFLEVBQUU7SUFDWixXQUFXLEVBQUUsR0FBRztDQUNuQixDQUFBO0FBRUQ7OztBQUdBLE1BQU0sV0FBVztJQUliLFlBQVksV0FBd0MsRUFBRSxXQUF3QztRQUMxRixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztRQUMvQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztLQUNsQztJQUVNLG9CQUFvQixDQUFDLE9BQWU7UUFDdkMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3BDO0lBRU0sb0JBQW9CLENBQUMsT0FBZTtRQUN2QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEM7Q0FDSjtNQUVvQixvQkFBcUIsU0FBUUEsZUFBTTtJQUF4RDs7UUFFSSxrQkFBYSxHQUFHLEtBQUssQ0FBQztRQStQdEIsYUFBUSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFBO1FBQzNCLGVBQVUsR0FBRyxPQUFPLENBQUE7S0E0QnZCO0lBMVJTLE1BQU07O1lBQ1IsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFMUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsQ0FBQyxHQUFrQjtnQkFDMUQsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxFQUFFO29CQUNuRCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtvQkFDekIsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO2lCQUN2QjthQUNKLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBa0I7Z0JBQ3hELElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsRUFBRTtvQkFDbkQsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO2lCQUN4QjthQUNKLENBQUMsQ0FBQTtZQUVGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsR0FBZTtnQkFDckQsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFOzs7O29CQUtwQixJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxFQUFFO3dCQUNoQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ3JCLE9BQU07cUJBQ1Q7b0JBRUQsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLE1BQWlCLENBQUM7b0JBQzFDLElBQUksV0FBVyxDQUFDLFFBQVEsS0FBSyxLQUFLLEVBQUU7O3dCQUVoQyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztxQkFDckM7aUJBQ0o7YUFDSixDQUFDLENBQUE7WUFFRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBRWxFLE9BQU8sQ0FBQyxHQUFHLENBQUMsK0JBQStCLENBQUMsQ0FBQTtTQUMvQztLQUFBOzs7O0lBS08sYUFBYTtRQUNqQixJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQTtRQUMxQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7S0FDdEI7SUFFRCxRQUFROztRQUVKLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQTtLQUN0Qjs7Ozs7OztJQVFhLFVBQVUsQ0FBQyxHQUFlLEVBQUUsV0FBb0I7O1lBQzFELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQztZQUV4RSxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO1lBRXpDLE1BQU0sVUFBVSxHQUFVLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRXpFLElBQUksUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQ3BELE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDOztZQUlsQyxNQUFNLFVBQVUsR0FBcUIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztZQUdwRixNQUFNLFdBQVcsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsQ0FBQzs7WUFHL0QsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO2dCQUN0QixNQUFNLE9BQU8sR0FBVyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pELElBQUksT0FBTyxHQUFXLE9BQU8sQ0FBQztnQkFDOUIsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDaEIsT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFBO2lCQUNwQztxQkFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRTtvQkFDM0QsT0FBTyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFBO2lCQUNwQztnQkFFRCxRQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEVBQUUsVUFBVSxDQUFDLGdCQUFnQixDQUFDLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDcko7aUJBQU07Z0JBQ0gsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUE7Z0JBQzdDLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsbUJBQW1CLENBQUMsb0JBQW9CLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzthQUN6Sjs7WUFHRCxJQUFJLFFBQVEsS0FBSyxnQkFBZ0IsRUFBRTtnQkFDL0IsTUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFBO2FBQ3BEO1NBRUo7S0FBQTs7Ozs7O0lBUWEsc0JBQXNCLENBQUMsWUFBcUI7O1lBQ3RELE9BQU8sSUFBSSxPQUFPLEVBQUUsQ0FBQyxPQUFPLEVBQUUsTUFBTTtnQkFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsSUFBSTtvQkFDcEMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksWUFBWUMscUJBQVksRUFBRTt3QkFDbkYsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzNCO2lCQUNKLENBQUMsQ0FBQTtnQkFFRixNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsc0NBQXNDLENBQUMsQ0FBQyxDQUFBO2FBQzVELEVBQUUsQ0FBQTtTQUNOO0tBQUE7Ozs7Ozs7SUFRTyxPQUFPLFNBQVMsQ0FBQyxZQUFvQixFQUFFLFNBQWlCO1FBQzVELE9BQU8sU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLFlBQVksUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7S0FDakY7Ozs7OztJQVFPLE9BQU8sbUJBQW1CLENBQUMsUUFBZ0I7UUFDL0MsUUFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUM5QixJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O1FBRXJELElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2pDLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO1NBQ2pDO1FBQ0QsT0FBTyxTQUFTLENBQUE7S0FDbkI7SUFFTyxhQUFhLENBQUMsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLE1BQWU7UUFDdEUsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzNCLE9BQU8sSUFBSSxDQUFDLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQTtTQUMzRDthQUFNLElBQUksUUFBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtZQUN6QyxNQUFNLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNyRSxPQUFPLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDM0Q7YUFBTSxJQUFJLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFO1lBQ3pELE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQzs7WUFFOUQsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQzs7WUFHbkQsTUFBTSxtQkFBbUIsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEYsT0FBTyxJQUFJLENBQUMsdUJBQXVCLENBQUMsbUJBQW1CLEVBQUUsUUFBUSxDQUFDLENBQUE7U0FDckU7UUFFRCxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUE7S0FDMUM7Ozs7Ozs7SUFRTyx3QkFBd0IsQ0FBQyxRQUFnQixFQUFFLFFBQWdCO1FBQy9ELE1BQU0sU0FBUyxHQUFHLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUE7O1FBRXBFLE1BQU0sYUFBYSxHQUFHLFNBQVMsR0FBRyxLQUFLLEdBQUcsR0FBRyxDQUFBOztRQUU3QyxNQUFNLGNBQWMsR0FBRyxTQUFTLEdBQUcsU0FBUyxHQUFHLEtBQUssQ0FBQTtRQUVwRCxNQUFNLGVBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLGNBQWMsVUFBVSxXQUFXLENBQUMsR0FBRyxHQUFDLFFBQVEsR0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFL0YsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLE9BQWUsS0FBSyxHQUFHLGFBQWEsR0FBRyxPQUFPLEtBQUssUUFBUSxHQUFHLENBQUM7UUFDN0YsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLE9BQWUsS0FBSyxHQUFHLGFBQWEsR0FBRyxPQUFPLEtBQUssUUFBUSxHQUFHLENBQUM7UUFFN0YsTUFBTSx3QkFBd0IsR0FBRyxDQUFDLE9BQWUsS0FBSyxLQUFLLFFBQVEsR0FBRyxDQUFDO1FBQ3ZFLE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxPQUFlLEtBQUssR0FBRyxhQUFhLEdBQUcsT0FBTyxLQUFLLFFBQVEsR0FBRyxDQUFDO1FBRWpHLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxXQUFXLENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUNyRixNQUFNLG1CQUFtQixHQUFHLElBQUksV0FBVyxDQUFDLHdCQUF3QixFQUFFLHdCQUF3QixDQUFDLENBQUM7UUFFaEcsT0FBTztZQUNILGVBQWUsRUFBRSxlQUFlO1lBQ2hDLGdCQUFnQixFQUFFLGdCQUFnQjtZQUNsQyxtQkFBbUIsRUFBRSxtQkFBbUI7U0FDM0MsQ0FBQTtLQUNKOzs7Ozs7O0lBUU8sdUJBQXVCLENBQUMsU0FBaUIsRUFBRSxRQUFnQjtRQUMvRCxNQUFNLFNBQVMsR0FBRyxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFBOztRQUVyRSxNQUFNLGFBQWEsR0FBRyxTQUFTLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQTs7UUFFN0MsTUFBTSxjQUFjLEdBQUcsU0FBUyxHQUFHLFNBQVMsR0FBRyxLQUFLLENBQUE7O1FBR3BELE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUV0RCxNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFBOztRQUVwRixNQUFNLGdCQUFnQixHQUFHLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1FBQ3ZGLElBQUksZ0JBQWdCLEVBQUU7WUFDbEIsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZCLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQTthQUNuQztpQkFBTSxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUIsU0FBUyxJQUFJLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFBO2FBQ25DO1NBQ0o7UUFFRCxNQUFNLGVBQWUsR0FBRyxJQUFJLE1BQU0sQ0FBQyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxjQUFjLFFBQVEsQ0FBQyxDQUFDO1FBRXZGLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxPQUFlLEtBQUssR0FBRyxTQUFTLEdBQUcsYUFBYSxHQUFHLE9BQU8sRUFBRSxDQUFDO1FBQzNGLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxPQUFlLEtBQUssR0FBRyxTQUFTLEdBQUcsYUFBYSxHQUFHLE9BQU8sRUFBRSxDQUFDO1FBRTNGLE1BQU0sd0JBQXdCLEdBQUcsQ0FBQyxPQUFlLEtBQUssR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUNyRSxNQUFNLHdCQUF3QixHQUFHLENBQUMsT0FBZSxLQUFLLEdBQUcsU0FBUyxHQUFHLGFBQWEsR0FBRyxPQUFPLEVBQUUsQ0FBQztRQUUvRixNQUFNLGdCQUFnQixHQUFHLElBQUksV0FBVyxDQUFDLG9CQUFvQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDckYsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLFdBQVcsQ0FBQyx3QkFBd0IsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO1FBRWhHLE9BQU87WUFDSCxlQUFlLEVBQUUsZUFBZTtZQUNoQyxnQkFBZ0IsRUFBRSxnQkFBZ0I7WUFDbEMsbUJBQW1CLEVBQUUsbUJBQW1CO1NBQzNDLENBQUE7S0FDSjtJQUdLLFlBQVk7O1lBQ2QsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1NBQzlFO0tBQUE7SUFFSyxZQUFZOztZQUNkLE1BQU0sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDdEM7S0FBQTs7SUFJRCxjQUFjLENBQUMsQ0FBTTtRQUNqQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7S0FDdEI7Ozs7SUFRRCxhQUFhO1FBQ1QsTUFBTSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDaEY7Ozs7SUFLRCxZQUFZO1FBQ1IsTUFBTSxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsUUFBZSxDQUFDLENBQUM7S0FDMUY7SUFFTyxtQkFBbUIsQ0FBQyxHQUFlO1FBQ3ZDLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXO1lBQzdCLEtBQUssV0FBVyxDQUFDLEdBQUc7Z0JBQ2hCLE9BQU8sR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUN0QixLQUFLLFdBQVcsQ0FBQyxJQUFJO2dCQUNqQixPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUM7WUFDdkIsS0FBSyxXQUFXLENBQUMsS0FBSztnQkFDbEIsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDO1NBQzNCO0tBQ0o7Q0FHSjtBQUVELE1BQU0seUJBQTBCLFNBQVFDLHlCQUFnQjtJQUdwRCxZQUFZLEdBQVEsRUFBRSxNQUE0QjtRQUM5QyxLQUFLLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0tBQ3hCO0lBRUQsT0FBTztRQUNILElBQUksRUFBQyxXQUFXLEVBQUMsR0FBRyxJQUFJLENBQUM7UUFFekIsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXBCLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUMsSUFBSSxFQUFFLDhCQUE4QixFQUFDLENBQUMsQ0FBQztRQUduRSxJQUFJQyxnQkFBTyxDQUFDLFdBQVcsQ0FBQzthQUNuQixPQUFPLENBQUMsYUFBYSxDQUFDO2FBQ3RCLE9BQU8sQ0FBQyxnRUFBZ0UsQ0FBQzthQUN6RSxXQUFXLENBQUMsUUFBUSxJQUFJLFFBQVE7YUFDNUIsU0FBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO2FBQ25DLFNBQVMsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQzthQUNqQyxTQUFTLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUM7YUFDckMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQzthQUMxQyxRQUFRLENBQUMsQ0FBTyxLQUFLO1lBQ2xCLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsR0FBRyxLQUFvQixDQUFDO1lBQ3hELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsQ0FBQTtTQUNuQyxDQUFBLENBQUMsQ0FDTCxDQUFDO1FBRU4sSUFBSUEsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLFdBQVcsQ0FBQzthQUNwQixPQUFPLENBQUMseUVBQXlFLENBQUM7YUFDbEYsU0FBUyxDQUFDLE1BQU07WUFDYixNQUFNO2lCQUNELFFBQVEsQ0FBQyxFQUFFLENBQUM7aUJBQ1osU0FBUyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2lCQUNwQixpQkFBaUIsRUFBRTtpQkFDbkIsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztpQkFDdkMsUUFBUSxDQUFDLENBQU8sS0FBSztnQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtnQkFDckMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFBO2FBQ25DLENBQUEsQ0FBQyxDQUFBO1NBQ1QsQ0FBQyxDQUFBO1FBRU4sSUFBSUEsZ0JBQU8sQ0FBQyxXQUFXLENBQUM7YUFDbkIsT0FBTyxDQUFDLGNBQWMsQ0FBQzthQUN2QixPQUFPLENBQUMsc0RBQXNELENBQUM7YUFDL0QsU0FBUyxDQUFDLE1BQU07WUFDYixNQUFNO2lCQUNELFFBQVEsQ0FBQyxHQUFHLENBQUM7aUJBQ2IsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO2lCQUN0QixpQkFBaUIsRUFBRTtpQkFDbkIsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQztpQkFDdkMsUUFBUSxDQUFDLENBQU8sS0FBSztnQkFDbEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQTtnQkFDeEMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxDQUFBO2FBQ25DLENBQUEsQ0FBQyxDQUFBO1NBQ1QsQ0FBQyxDQUFBO0tBQ1Q7Q0FDSjtBQUVEOzs7OztBQUtBLFNBQVMsV0FBVyxDQUFDLE1BQWM7SUFDL0IsT0FBTyxNQUFNLENBQUMsT0FBTyxDQUFDLHdCQUF3QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzVEOzs7OyJ9
