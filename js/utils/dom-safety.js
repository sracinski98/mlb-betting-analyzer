// DOM Safety Utilities
/**
 * SafeDOM - A utility class for safe DOM operations with error boundaries
 */
class SafeDOM {
    #containers = new Map();

    #handleError(operation, error) {
        console.error(`SafeDOM Error during ${operation}:`, error);
        return false;
    }

    #validateContainer(id) {
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid container ID');
        }
    }

    #validateContent(content) {
        if (content === undefined || content === null) {
            throw new Error('Invalid content');
        }
    }

    /**
     * Safely set innerHTML of an element
     */
    setHTML = (elementId, content) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) return false;
            element.innerHTML = content;
            return true;
        } catch (error) {
            console.error(`Error setting innerHTML for #${elementId}:`, error);
            return false;
        }
    }

    /**
     * Safely set text content of an element
     */
    setText = (elementId, text) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) return false;
            element.textContent = text;
            return true;
        } catch (error) {
            console.error(`Error setting text for #${elementId}:`, error);
            return false;
        }
    }

    /**
     * Safely ensure a container exists
     */
    ensureContainer = (id) => {
        try {
            let container = document.getElementById(id);
            if (!container) {
                container = document.createElement('div');
                container.id = id;
                document.body.appendChild(container);
            }
            this.containers.set(id, container);
            return container;
        } catch (error) {
            console.error(`Error ensuring container #${id}:`, error);
            return null;
        }
    }

    /**
     * Safely get a container
     */
    getContainer = (id) => {
        try {
            return this.containers.get(id) || document.getElementById(id);
        } catch (error) {
            console.error(`Error getting container #${id}:`, error);
            return null;
        }
    }

    /**
     * Safely toggle class on element
     */
    toggleClass = (elementId, className, force) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) return false;
            element.classList.toggle(className, force);
            return true;
        } catch (error) {
            console.error(`Error toggling class for #${elementId}:`, error);
            return false;
        }
    }

    /**
     * Safely add event listener
     */
    addListener = (elementId, event, handler) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) return false;
            element.addEventListener(event, handler);
            return true;
        } catch (error) {
            console.error(`Error adding listener to #${elementId}:`, error);
            return false;
        }
    }

    /**
     * Safely remove event listener
     */
    removeListener = (elementId, event, handler) => {
        try {
            const element = document.getElementById(elementId);
            if (!element) return false;
            element.removeEventListener(event, handler);
            return true;
        } catch (error) {
            console.error(`Error removing listener from #${elementId}:`, error);
            return false;
        }
    }

    /**
     * Create element with safety checks
     */
    createElement = (parentId, tagName, attributes = {}) => {
        try {
            const parent = document.getElementById(parentId);
            if (!parent) return null;

            const element = document.createElement(tagName);
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else {
                    element.setAttribute(key, value);
                }
            });

            parent.appendChild(element);
            return element;
        } catch (error) {
            console.error(`Error creating element in #${parentId}:`, error);
            return null;
        }
    }
}

export default new SafeDOM();
    setText: (elementId, text) => {            return false;
        }
    }
};

export { SafeDOM };     try {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = text;
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`Failed to set text for ${elementId}:`, error);
            return false;
        }
    },

    setHTML: (elementId, html) => {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = html;
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`Failed to set HTML for ${elementId}:`, error);
            return false;
        }
    },

    toggleClass(elementId, className, force) {
        try {
            const element = document.getElementById(elementId);
            if (element) {
                element.classList.toggle(className, force);
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`Failed to toggle class for ${elementId}:`, error);
            return false;
        }
    },

    createElement: (parentId, tag, attributes = {}, innerHTML = '') => {
        try {
            const parent = document.getElementById(parentId);
            if (!parent) return null;

            const element = document.createElement(tag);
            Object.entries(attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
            
            if (innerHTML) {
                element.innerHTML = innerHTML;
            }
            
            parent.appendChild(element);
            return element;
        } catch (error) {
            console.warn(`Failed to create element in ${parentId}:`, error);
            return null;
        }
    },

    ensureContainer: (containerId) => {
        try {
            let container = document.getElementById(containerId);
            if (!container) {
                container = document.createElement('div');
                container.id = containerId;
                document.body.appendChild(container);
            }
            return container;
        } catch (error) {
            console.warn(`Failed to ensure container ${containerId}:`, error);
            return null;
        }
    }
};
