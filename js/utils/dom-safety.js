// DOM Safety Utilities
/**
 * SafeDOM - A utility class for safe DOM operations with error boundaries
 */
class SafeDOM {
    #containers = new Map();
    #initialized = false;

    constructor() {
        if (typeof window !== 'undefined') {
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.#initializeContainers());
            } else {
                this.#initializeContainers();
            }
        }
    }

    #initializeContainers() {
        try {
            // Create main container if it doesn't exist
            let mainContainer = document.getElementById('app-container');
            if (!mainContainer) {
                mainContainer = document.createElement('div');
                mainContainer.id = 'app-container';
                document.body.appendChild(mainContainer);
            }

            // Required containers
            const requiredContainers = [
                'quickPicksContent',
                'teamBetsContent',
                'playerPropsContent',
                'parlaysContent',
                'loadingState',
                'errorState',
                'errorMessage',
                'welcomeState',
                'resultsContainer',
                'progressBar',
                'loadingStep'
            ];

            requiredContainers.forEach(id => {
                let container = document.getElementById(id);
                if (!container) {
                    container = document.createElement('div');
                    container.id = id;
                    mainContainer.appendChild(container);
                }
                this.#containers.set(id, container);
            });

            this.#initialized = true;
        } catch (error) {
            console.error('Error initializing containers:', error);
        }
    }

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
            // First ensure the container exists
            const container = this.ensureContainer(elementId);
            if (!container) {
                console.warn(`Container #${elementId} could not be created`);
                return false;
            }

            // Set the content
            container.innerHTML = content;
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
            // Wait for initialization if needed
            if (!this.#initialized) {
                this.#initializeContainers();
            }

            // Check cached container first
            let container = this.#containers.get(id);
            
            // If not in cache, check DOM
            if (!container) {
                container = document.getElementById(id);
            }
            
            // If still not found, create it
            if (!container) {
                const mainContainer = document.getElementById('app-container') || document.body;
                container = document.createElement('div');
                container.id = id;
                mainContainer.appendChild(container);
                this.#containers.set(id, container);
            }
            
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

}

// Export a singleton instance
export default new SafeDOM();
