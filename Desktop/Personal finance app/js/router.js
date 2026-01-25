class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    }

    register(path, callback) {
        this.routes[path] = callback;
    }

    navigate(path) {
        window.location.hash = `#/${path}`;
    }

    getCurrentRoute() {
        const hash = window.location.hash.slice(1);
        const path = hash.split('/')[1] || 'overview';
        return path;
    }

    handleRoute() {
        const route = this.getCurrentRoute();
        this.updateActiveNav(route);
        
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });
        
        const pageElement = document.getElementById(`page-${route}`);
        if (pageElement) {
            pageElement.classList.remove('hidden');
            this.currentRoute = route;
            
            if (this.routes[route]) {
                this.routes[route]();
            }
        } else {
            this.navigate('overview');
        }
    }

    updateActiveNav(route) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === route) {
                link.classList.add('active');
            }
        });
    }
}

const router = new Router();
