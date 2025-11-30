/**
 * @file Trinity Project Lottie Grid (DotLottie Refactor)
 */
import { DotLottie } from 'https://cdn.jsdelivr.net/npm/@lottiefiles/dotlottie-web/+esm';

(function () {
    'use strict';

    const ANIMATION_SECTIONS = [
        {
            id: 'logotype-section',
            title: 'Logotype',
            description: 'Main text animations.',
            animations: [
                { 
                    fileName: "Logotype Intro.lottie", 
                    animationType: "playAndHold", 
                    feedback: "Freezes on end"
                },
                { 
                    fileName: "Logotype Idle.lottie", 
                    animationType: "loop",
                    feedback: "Continuous idle loop"
                }
            ]
        },
        {
            id: 'symbol-section',
            title: 'Symbol',
            description: 'Iconography and In/Out states.',
            animations: [
                { 
                    fileName: "Symbol Idle.lottie", 
                    animationType: "loop", 
                    feedback: "Floating/Idle state"
                },
                { 
                    fileName: "Symbol In-Out Long.lottie", 
                    displayName: "Symbol In-Out (Long)", 
                    animationType: "loop", 
                    feedback: "Long duration hold"
                },
                { 
                    fileName: "Symbol In-Out Short.lottie", 
                    displayName: "Symbol In-Out (Short)", 
                    animationType: "loop", 
                    feedback: "Quick interaction"
                }
            ]
        }
    ];

    class LottieCard {
        constructor(wrapper, animationData) {
            this.wrapper = wrapper;
            this.animationData = animationData;
            this.containerDiv = wrapper.querySelector('.lottie-animation');
            
            this.canvas = document.createElement('canvas');
            this.containerDiv.appendChild(this.canvas);

            this.dotLottie = null;
            this.totalFrames = 0;
            this.isHovering = false;
            this.isLightMode = false;
            
            // Check if this is the specific "Logotype Intro" animation
            this.isLogotypeIntro = this.animationData.fileName.includes("Logotype Intro");

            this.boundOnFrame = this.onFrame.bind(this);
            this.boundOnLoad = this.onLoad.bind(this);
            this.boundOnComplete = this.onComplete.bind(this);

            this.cacheDomElements();
            this.attachEventListeners();
            this.loadAnimationForTheme(this.isLightMode);
        }

        cacheDomElements() {
            this.ui = {
                frameCounter: this.wrapper.querySelector('.frame-counter'),
                playheadMarker: this.wrapper.querySelector('.playhead-marker'),                
                themeToggle: this.wrapper.querySelector('.theme-toggle'),
                progressFull: this.wrapper.querySelector('.timeline-progress-fill'),
                frameNums: {
                    start: this.wrapper.querySelector('.frame-num-start'),
                    end: this.wrapper.querySelector('.frame-num-end')
                }
            };
        }

        attachEventListeners() {
            this.containerDiv.addEventListener('mouseenter', this.onHoverStart.bind(this));
            this.containerDiv.addEventListener('mouseleave', this.onHoverEnd.bind(this));
            this.ui.themeToggle.addEventListener('change', this.onThemeChange.bind(this));
        }

        loadAnimationForTheme(isLight) {
            const themeFolder = isLight ? 'White' : 'Black';
            const path = `Lotties/${themeFolder}/${this.animationData.fileName}`;

            // CHANGED LOGIC:
            // If it's the Intro: Autoplay OFF, Loop OFF (wait for hover)
            // Everything else: Autoplay ON, Loop ON (ignore hover)
            const shouldLoop = !this.isLogotypeIntro;
            const shouldAutoplay = !this.isLogotypeIntro;

            if (!this.dotLottie) {
                this.dotLottie = new DotLottie({
                    canvas: this.canvas,
                    src: path,
                    loop: shouldLoop,
                    autoplay: shouldAutoplay,
                });
                
                this.dotLottie.addEventListener('load', this.boundOnLoad);
                this.dotLottie.addEventListener('frame', this.boundOnFrame);
                this.dotLottie.addEventListener('complete', this.boundOnComplete);
            } else {
                this.dotLottie.load({ 
                    src: path,
                    loop: shouldLoop,
                    autoplay: shouldAutoplay
                });
            }
        }

        onLoad() {
            setTimeout(() => {
                this.totalFrames = Math.floor(this.dotLottie.totalFrames);
                if (this.ui.frameNums.end) this.ui.frameNums.end.textContent = this.totalFrames;
                
                // If it's NOT autoplaying (e.g. Intro), ensure we are at frame 0
                if (this.isLogotypeIntro) {
                    this.dotLottie.setFrame(0);
                    this.updateTimelineUI(0, false);
                }
            }, 50);
        }

        onFrame(event) {
            const currentFrame = Math.floor(event.currentFrame);
            this.updateTimelineUI(currentFrame, true);
        }

        onComplete() {
            // Only relevant for Logotype Intro (others loop forever)
            if (this.isLogotypeIntro) {
                // Keep the highlight active
                this.wrapper.classList.add('playing'); 
            }
        }

        onHoverStart() {
            // Always add visual highlight class
            this.wrapper.classList.add('playing');
            this.isHovering = true;

            if (!this.dotLottie || !this.dotLottie.isLoaded) return;
            
            // Only manually trigger play for the Intro
            // The others are already playing
            if (this.isLogotypeIntro) {
                this.dotLottie.setFrame(0);
                this.dotLottie.play();
            }
        }

        onHoverEnd() {
            this.isHovering = false;
            this.wrapper.classList.remove('playing');

            // Only manually stop the Intro
            // The others should keep playing
            if (this.isLogotypeIntro) {
                this.dotLottie.pause();
                this.dotLottie.setFrame(0);
                this.updateTimelineUI(0, false);
            }
        }

        onThemeChange() {
            this.isLightMode = this.ui.themeToggle.checked;
            this.wrapper.classList.toggle('light-mode', this.isLightMode);
            this.wrapper.dispatchEvent(new CustomEvent('themeChange', {
                detail: { isLight: this.isLightMode },
                bubbles: true,
                composed: true
            }));
            this.loadAnimationForTheme(this.isLightMode);
        }

        updateTimelineUI(currentFrame, isPlaying) {
            if (this.ui.frameCounter) {
                this.ui.frameCounter.textContent = `FR: ${currentFrame}`;
            }

            if (this.totalFrames === 0) return;

            const progressPercent = (currentFrame / this.totalFrames) * 100;

            if (this.ui.progressFull) {
                this.ui.progressFull.style.width = `${progressPercent}%`;
            }

            // Determine visibility of playhead
            // Visible if: 
            // 1. Is Playing
            // 2. OR it's the Intro, it's hovering, and it's holding at the end
            let showMarker = isPlaying;
            
            // Special case for Intro Hold state
            if (this.isLogotypeIntro && this.isHovering && !isPlaying) {
                showMarker = true; 
            }

            if (this.ui.playheadMarker) {
                this.ui.playheadMarker.style.left = `${progressPercent}%`;
                this.ui.playheadMarker.style.opacity = showMarker ? '1' : '0';
            }
        }
    }

    function setupAnimationGrids() {
        const mainContainer = document.getElementById('animation-sections-container');
        const cardTemplate = document.getElementById('lottie-card-template');

        if (!mainContainer || !cardTemplate) return;

        ANIMATION_SECTIONS.forEach(section => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'section-container';

            const titleEl = document.createElement('h3');
            titleEl.textContent = section.title;
            sectionEl.appendChild(titleEl);

            const descriptionEl = document.createElement('p');
            descriptionEl.className = 'section-description';
            descriptionEl.textContent = section.description;
            sectionEl.appendChild(descriptionEl);

            const gridEl = document.createElement('div');
            gridEl.id = section.id;
            gridEl.className = 'animation-grid';
            sectionEl.appendChild(gridEl);

            mainContainer.appendChild(sectionEl);

            populateGrid(gridEl, descriptionEl, cardTemplate, section.animations);
        });
    }

    function populateGrid(gridContainer, descriptionEl, cardTemplate, animations) {
        animations.forEach((animationData, index) => {
            const cardFragment = cardTemplate.content.cloneNode(true);
            const wrapper = cardFragment.querySelector('.animation-wrapper');
            if (!wrapper) return;

            const titleEl = wrapper.querySelector('.lottie-title');
            const title = (animationData.displayName || animationData.fileName).replace('.lottie', '');
            titleEl.textContent = title;
            
            if (animationData.feedback) {
                const feedbackEl = document.createElement('div');
                feedbackEl.className = 'feedback-note';
                feedbackEl.textContent = animationData.feedback;
                titleEl.parentNode.appendChild(feedbackEl);
            }

            wrapper.addEventListener('themeChange', (e) => {
                descriptionEl.classList.toggle('light-mode', e.detail.isLight);
            });
            
            gridContainer.appendChild(cardFragment);
            new LottieCard(wrapper, animationData);
        });
    }

    document.addEventListener('DOMContentLoaded', setupAnimationGrids);

})();