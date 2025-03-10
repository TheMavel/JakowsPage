document.addEventListener('DOMContentLoaded', () => {
    'use strict';
    
    // ---------- Performance-Verbesserungen ----------
    
    // Lazy-Loading für Bilder
    const lazyLoadImages = () => {
        if ('loading' in HTMLImageElement.prototype) {
            // Nutze natives lazy loading für Browser, die es unterstützen
            const images = document.querySelectorAll('img[loading="lazy"]');
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
        } else {
            // Fallback für Browser ohne natives lazy loading
            const lazyImages = document.querySelectorAll('img[data-src]');
            if (lazyImages.length === 0) return;
            
            const lazyImageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        lazyImageObserver.unobserve(img);
                    }
                });
            });
            
            lazyImages.forEach(image => lazyImageObserver.observe(image));
        }
    };
    
    // Cache DOM-Selektoren für verbesserte Performance
    const cache = {
        navbar: document.querySelector('.navbar'),
        burger: document.querySelector('.burger'),
        navMenu: document.querySelector('.nav-links'),
        navLinks: document.querySelectorAll('.nav-links li'),
        navLinksAnchors: document.querySelectorAll('.nav-links a'),
        sections: Array.from(document.querySelectorAll('section[id]')),
        hero: document.querySelector('.hero'),
        profileImage: document.querySelector('.profile-image'),
        heroText: document.querySelector('.hero-text'),
        scrollIndicator: document.querySelector('.scroll-indicator'),
        tabButtons: document.querySelectorAll('.path-button'),
        tabContents: document.querySelectorAll('.path-content'),
        cards: document.querySelectorAll('.service-card, .lab-card, .case-study-item, .module-item, .vision-principle'),
        contactForm: document.getElementById('contact-form'),
        formInputs: document.querySelectorAll('#contact-form input, #contact-form textarea, #contact-form select'),
        body: document.body
    };
    
    // ---------- Utility Functions ----------
    
    // Debounce function to limit how often a function can be called
    const debounce = (func, delay) => {
        let inDebounce;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(inDebounce);
            inDebounce = setTimeout(() => func.apply(context, args), delay);
        };
    };
    
    // Check if element is in viewport
    const isInViewport = (element, offset = 0, threshold = 0) => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Element is considered in view if its top edge is within the viewport with some threshold
        return (
            rect.top <= windowHeight * (1 - threshold) && 
            rect.bottom >= windowHeight * offset
        );
    };
    
    // ---------- Animation Controllers ----------
    
    // Intersection Observer for scroll-based animations
    const createScrollObserver = (targetSelector, animationClass = 'visible', threshold = 0.15, rootMargin = '0px') => {
        const targets = document.querySelectorAll(targetSelector);
        if (!targets.length) return;
        
        // Optimierte IntersectionObserver-Nutzung
        const observer = new IntersectionObserver((entries) => {
            // Gruppiere DOM-Schreiboperationen für bessere Performance
            const addAnimations = [];
            const removeAnimations = [];
            
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    addAnimations.push(() => {
                        entry.target.classList.add(animationClass);
                        
                        // Holen und animieren von Kind-Elementen
                        const staggeredElements = entry.target.querySelectorAll('.stagger');
                        staggeredElements.forEach((el, i) => {
                            el.style.transitionDelay = `${i * 0.1}s`;
                            el.classList.add('visible');
                        });
                    });
                    
                    if (!entry.target.classList.contains('repeat-animation')) {
                        observer.unobserve(entry.target);
                    }
                } else if (entry.target.classList.contains('repeat-animation')) {
                    removeAnimations.push(() => {
                        entry.target.classList.remove(animationClass);
                        
                        const staggeredElements = entry.target.querySelectorAll('.stagger');
                        staggeredElements.forEach(el => {
                            el.classList.remove('visible');
                            el.style.transitionDelay = '0s';
                        });
                    });
                }
            });
            
            // Batche DOM-Operationen für bessere Performance
            if (addAnimations.length || removeAnimations.length) {
                requestAnimationFrame(() => {
                    addAnimations.forEach(fn => fn());
                    removeAnimations.forEach(fn => fn());
                });
            }
        }, {
            threshold,
            rootMargin
        });
        
        targets.forEach(target => observer.observe(target));
        return observer;
    };
    
    // Apply animation classes to elements with specific data attributes
    const initAnimationClasses = () => {
        // Fade-in animation classes
        document.querySelectorAll('[data-animation]').forEach(el => {
            const animationType = el.dataset.animation || 'fade-in-up';
            const delay = el.dataset.delay || 0;
            
            el.classList.add(animationType);
            el.style.animationDelay = `${delay}s`;
        });
        
        // Setup staggered animations
        document.querySelectorAll('[data-stagger-parent]').forEach(parent => {
            const children = parent.querySelectorAll('[data-stagger-child]');
            children.forEach((child, index) => {
                child.classList.add('stagger');
                child.style.transitionDelay = `${index * 0.1}s`;
            });
        });
    };
    
    // ---------- Navigation & Header ----------
    
    // Mobile Navigation Toggle
    const initMobileNav = () => {
        if (!cache.burger || !cache.navMenu) return;
        
        // Check if device is iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
            document.documentElement.classList.add('ios');
        }
        
        // Add backdrop element for mobile nav
        const backdrop = document.createElement('div');
        backdrop.classList.add('mobile-nav-backdrop');
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.zIndex = '1400';
        backdrop.style.opacity = '0';
        backdrop.style.visibility = 'hidden';
        backdrop.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
        document.body.appendChild(backdrop);
        
        const toggleMenu = () => {
            // Toggle navigation menu
            cache.navMenu.classList.toggle('nav-active');
            cache.burger.classList.toggle('toggle');
            
            // Toggle backdrop
            if (cache.navMenu.classList.contains('nav-active')) {
                backdrop.style.opacity = '1';
                backdrop.style.visibility = 'visible';
                
                // Handle iOS scroll fix
                if (isIOS) {
                    cache.body.classList.add('ios-scroll-fix');
                    cache.body.style.top = -window.scrollY + 'px';
                } else {
                    cache.body.style.overflow = 'hidden';
                }
            } else {
                backdrop.style.opacity = '0';
                backdrop.style.visibility = 'hidden';
                
                // Restore scroll
                if (isIOS) {
                    cache.body.classList.remove('ios-scroll-fix');
                    const scrollY = parseInt(cache.body.style.top || '0') * -1;
                    cache.body.style.top = '';
                    window.scrollTo(0, scrollY);
                } else {
                    cache.body.style.overflow = '';
                }
            }
            
            // Animate links with staggered delay
            cache.navLinks.forEach((link, index) => {
                if (link.style.animation) {
                    link.style.animation = '';
                } else {
                    link.style.animation = `fadeIn 0.5s ease forwards ${index / 7 + 0.3}s`;
                }
            });
        };
        
        // Burger menu click event
        cache.burger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });
        
        // Backdrop click closes menu
        backdrop.addEventListener('click', toggleMenu);
        
        // Close menu when link is clicked
        cache.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (cache.navMenu.classList.contains('nav-active')) {
                    toggleMenu();
                }
            });
        });
        
        // Add current page indicator
        const currentPath = window.location.pathname;
        cache.navLinksAnchors.forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
        
        // Ensure navbar is visible on page load
        if (cache.navbar) {
            cache.navbar.style.display = 'block';
        }
    };
    
    // Header scroll effects
    const initHeaderScroll = () => {
        if (!cache.navbar) return;
        
        const updateHeaderState = () => {
            if (window.scrollY > 50) {
                cache.navbar.classList.add('scrolled');
            } else {
                cache.navbar.classList.remove('scrolled');
            }
        };
        
        // Check on page load
        updateHeaderState();
        
        // Check on scroll with debounce and passive event listener
        window.addEventListener('scroll', debounce(updateHeaderState, 10), { passive: true });
    };
    
    // Active nav link highlighting based on scroll position
    const initActiveNavHighlight = () => {
        if (cache.navLinksAnchors.length === 0 || cache.sections.length === 0) return;
        
        const updateActiveNav = debounce(() => {
            let currentSection = null;
            const scrollPosition = window.scrollY + 100; // Offset for better highlighting
            
            cache.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (
                    scrollPosition >= sectionTop && 
                    scrollPosition < sectionTop + sectionHeight
                ) {
                    currentSection = section.id;
                }
            });
            
            cache.navLinksAnchors.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSection}`) {
                    link.classList.add('active');
                }
            });
        }, 100);
        
        window.addEventListener('scroll', updateActiveNav, { passive: true });
        updateActiveNav(); // Call initially
    };
    
    // ---------- Scrolling Effects ----------
    
    // Parallax scroll effect for hero section
    const initHeroParallax = () => {
        if (!cache.hero || !cache.profileImage) return;
        
        // Skip on mobile devices for better performance
        if (window.innerWidth <= 768) return;
        
        let ticking = false;
        
        const updateParallax = () => {
            const scrollPosition = window.pageYOffset;
            const heroHeight = cache.hero.offsetHeight;
            const scrollPercentage = Math.min(scrollPosition / (heroHeight / 1.2), 1);
            
            if (scrollPosition > 0) {
                // Verbesserte Leistung durch gemeinsamen Style-Batch
                requestAnimationFrame(() => {
                    // CSS-Transformationen für bessere Performance
                    const imageTransform = `scale(${1 - scrollPercentage * 0.12}) translateY(${scrollPercentage * 30}px)`;
                    cache.profileImage.style.transform = imageTransform;
                    cache.profileImage.style.opacity = 1 - scrollPercentage * 0.5;
                    
                    if (cache.heroText) {
                        cache.heroText.style.transform = `translateY(${scrollPercentage * 50}px)`;
                        cache.heroText.style.opacity = 1 - scrollPercentage * 0.7;
                    }
                });
            } else {
                requestAnimationFrame(() => {
                    // Reset Styles
                    cache.profileImage.style.transform = 'scale(1) translateY(0)';
                    cache.profileImage.style.opacity = '1';
                    
                    if (cache.heroText) {
                        cache.heroText.style.transform = 'translateY(0)';
                        cache.heroText.style.opacity = '1';
                    }
                });
            }
            
            ticking = false;
        };
        
        // Optimierte Event-Behandlung mit passivem Event-Listener
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
        
        // Initial update
        updateParallax();
    };
    
    // Smooth scroll for anchor links
    const initSmoothScroll = () => {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                
                const target = document.querySelector(this.getAttribute('href'));
                if (!target) return;
                
                // Get navbar height for proper offset
                const navbarHeight = cache.navbar ? cache.navbar.offsetHeight : 0;
                
                // Calculate position with better offset
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            });
        });
    };
    
    // Scroll indicator
    const initScrollIndicator = () => {
        if (!cache.scrollIndicator) return;
        
        window.addEventListener('scroll', debounce(() => {
            const scrollPercentage = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            
            if (scrollPercentage < 5) {
                cache.scrollIndicator.style.opacity = '1';
            } else {
                cache.scrollIndicator.style.opacity = '0';
            }
        }, 100), { passive: true });
    };
    
    // ---------- Interactive Elements ----------
    
    // Initialize tabs in learning path section
    const initTabs = () => {
        if (!cache.tabButtons.length) return;
        
        cache.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-path');
                
                // Remove active class from all buttons and contents
                cache.tabButtons.forEach(btn => btn.classList.remove('active'));
                cache.tabContents.forEach(content => {
                    content.classList.remove('active');
                    content.style.opacity = '0'; // Start fade out
                });
                
                // Add active class to selected button and content
                button.classList.add('active');
                const activeContent = document.getElementById(`${tabId}-path`);
                
                if (activeContent) {
                    setTimeout(() => {
                        activeContent.classList.add('active');
                        setTimeout(() => {
                            activeContent.style.opacity = '1'; // Fade in
                        }, 50);
                    }, 300); // Wait for fade out
                }
            });
        });
        
        // Activate first tab by default if none is active
        if (!document.querySelector('.path-button.active') && cache.tabButtons.length) {
            cache.tabButtons[0].click();
        }
    };
    
    // Enhanced hover effects for cards
    const initCardEffects = () => {
        // Skip on mobile for performance
        if (window.innerWidth <= 992) return;
        
        cache.cards.forEach(card => {
            // Skip if card already has mousemove event
            if (card.dataset.hasMouseEffect) return;
            card.dataset.hasMouseEffect = 'true';
            
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // X position within element
                const y = e.clientY - rect.top; // Y position within element
                
                // Calculate tilt angle (limited to small values)
                const tiltX = ((y / rect.height) - 0.5) * 8; // Negative at top, positive at bottom
                const tiltY = ((x / rect.width) - 0.5) * -8; // Positive at left, negative at right
                
                // Calculate position for shine effect
                const shine = card.querySelector('.card-shine');
                if (shine) {
                    shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 80%)`;
                }
                
                // Apply tilt effect
                card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            
            // Reset on mouse leave
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
                
                const shine = card.querySelector('.card-shine');
                if (shine) {
                    shine.style.opacity = '0';
                }
            });
            
            // Add shine element if it doesn't exist
            if (!card.querySelector('.card-shine')) {
                const shine = document.createElement('div');
                shine.classList.add('card-shine');
                shine.style.position = 'absolute';
                shine.style.top = '0';
                shine.style.left = '0';
                shine.style.width = '100%';
                shine.style.height = '100%';
                shine.style.opacity = '0';
                shine.style.pointerEvents = 'none';
                shine.style.transition = 'opacity 0.3s ease';
                shine.style.zIndex = '1';
                card.style.position = 'relative';
                card.style.overflow = 'hidden';
                card.appendChild(shine);
                
                // Show shine on hover
                card.addEventListener('mouseenter', () => {
                    shine.style.opacity = '1';
                });
            }
        });
    };
    
    // Contact form validation and submission
    const initContactForm = () => {
        if (!cache.contactForm) return;
        
        // Input validation
        if (cache.formInputs) {
            cache.formInputs.forEach(input => {
                // Validate on blur
                input.addEventListener('blur', () => {
                    validateInput(input);
                });
                
                // Clear error on focus
                input.addEventListener('focus', () => {
                    const errorElement = input.parentElement.querySelector('.error-message');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    input.classList.remove('error');
                });
            });
        }
        
        // Form submission
        cache.contactForm.addEventListener('submit', e => {
            e.preventDefault();
            
            // Validate all inputs first
            let isValid = true;
            cache.formInputs.forEach(input => {
                if (!validateInput(input)) {
                    isValid = false;
                }
            });
            
            if (!isValid) return;
            
            // Simulate sending (would connect to a server in production)
            const submitButton = cache.contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.disabled = true;
            submitButton.textContent = 'Wird gesendet...';
            
            // Simulate API call (remove in production)
            setTimeout(() => {
                // Success message
                const formContainer = cache.contactForm.closest('.contact-form');
                formContainer.innerHTML = `
                    <div class="success-message">
                        <i class="fas fa-check-circle"></i>
                        <h3>Nachricht gesendet!</h3>
                        <p>Vielen Dank für deine Nachricht. Ich werde mich so schnell wie möglich bei dir melden.</p>
                    </div>
                `;
                
                // Add animation class
                const successMessage = formContainer.querySelector('.success-message');
                setTimeout(() => {
                    successMessage.classList.add('visible');
                }, 10);
                
            }, 1500);
        });
        
        // Input validation helper
        function validateInput(input) {
            const value = input.value.trim();
            const name = input.getAttribute('name');
            let errorMessage = '';
            
            // Clear previous error
            const existingError = input.parentElement.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Check for required fields
            if (input.hasAttribute('required') && !value) {
                errorMessage = 'Dieses Feld wird benötigt';
            } 
            // Validate email format
            else if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errorMessage = 'Bitte gib eine gültige E-Mail-Adresse ein';
            }
            
            // Display error if any
            if (errorMessage) {
                input.classList.add('error');
                const error = document.createElement('div');
                error.className = 'error-message';
                error.textContent = errorMessage;
                input.parentElement.appendChild(error);
                return false;
            } else {
                input.classList.remove('error');
                return true;
            }
        }
    };
    
    // Optimierte Funktion für das Hinzufügen von Resize-Event-Listenern
    const addResizeHandlers = () => {
        // Resize-Listener für alle Funktionen, die auf Größenänderungen reagieren müssen
        const handleResize = debounce(() => {
            // Reaktiviere Parallax-Effekt, wenn Größe sich ändert
            initHeroParallax();
            // Aktualisiere Karteneffekte
            initCardEffects();
        }, 250);
        
        window.addEventListener('resize', handleResize, { passive: true });
    };
    
    // Seitenlade-Effekte optimieren
    const initPageLoadEffects = () => {
        // Automatisch das aktuelle Jahr im Footer aktualisieren
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
        // Füge eine Klasse hinzu, wenn die Seite vollständig geladen ist
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
            
            // Verberge den Ladebildschirm mit einer Animation
            const loader = document.querySelector('.page-loader');
            if (loader) {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }
        });
    };
    
    // ---------- Initialize All Components ----------
    
    // Performance optimizations
    lazyLoadImages();
    
    // Setup animations
    initAnimationClasses();
    
    // Initialize observers for animation triggers
    createScrollObserver('.fade-in-up, .fade-in-left, .fade-in-right, .fade-in, .scale-in', 'visible', 0.1);
    createScrollObserver('.lab-card, .module-item, .case-study-item, .vision-principle, .scenario-step, .contact-card', 'scrolled', 0.15);
    
    // Initialize UI components
    initMobileNav();
    initHeaderScroll();
    initActiveNavHighlight();
    initHeroParallax();
    initSmoothScroll();
    initScrollIndicator();
    initTabs();
    initCardEffects();
    initContactForm();
    
    // More performance optimizations
    addResizeHandlers();
    initPageLoadEffects();
}); 