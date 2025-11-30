/**
 * @file Trinity Project Lottie Grid (DotLottie Version)
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
                    animationType: "playOnce",
                    feedback: "Standard build-in"
                },
                { 
                    fileName: "Logotype Idle.lottie", 
                    animationType: "loop",
                    loopFrames: [0, 120], 
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
                    loopFrames: [0, 60],
                    feedback: "Floating/Idle state"
                },
                { 
                    fileName: "Symbol In-Out Long.lottie", 
                    displayName: "Symbol In-Out (Long)", 
                    animationType: "loop", 
                    loopFrames: [30, 90], 
                    feedback: "Long duration hold"
                },
                { 
                    fileName: "Symbol In-Out Short.lottie", 
                    displayName: "Symbol In-Out (Short)", 
                    animationType: "loop", 
                    loopFrames: [20, 60],
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
            
            // Create a canvas for DotLottie
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.containerDiv.appendChild(this.canvas);

            this.dotLottie = null;
            this.totalFrames = 0;
            this.isHovering = false;
            this.isOutroLocked = false;
            this.isLightMode = false;

            this.boundOnFrame = this.onFrame.bind(this);
            this.boundOnLoad = this.onLoad.bind(this);
            this.boundOnComplete = this.onComplete.bind(this);

            this.parseAnimationProps();
            this.cacheDomElements();
            this.attachEventListeners();
            this.loadAnimationForTheme(this.isLightMode);
        }

        parseAnimationProps() {
            this.animationType = this.animationData.animationType || 'playOnce';
            this.isLooping = this.animationType === 'loop';

            if (this.isLooping && this.animationData.loopFrames) {
                this.loopStartFrame = this.animationData.loopFrames[0];
                this.loopEndFrame = this.animationData.loopFrames[1];
            } else {
                this.loopStartFrame = 0;
                this.loopEndFrame = 0;
            }
        }

        cacheDomElements() {
            // UI Caching logic (Identical to previous version)
            this.ui = {
                frameCounter: this.wrapper.querySelector('.frame-counter'),
                playheadMarker: this.isLooping
                ? this.wrapper.querySelector('.timeline-looping .playhead-marker')
                : this.wrapper.querySelector('.timeline-simple .playhead-marker'),                
                themeToggle: this.wrapper.querySelector('.theme-toggle'),
                progressFull: this.wrapper.querySelector('.progress-full'),
                segments: {
                    intro: this.wrapper.querySelector('.segment-intro'),
                    loop: this.wrapper.querySelector('.segment-loop'),
                    outro: this.wrapper.querySelector('.segment-outro')
                },
                progress: {
                    intro: this.wrapper.querySelector('.progress-intro'),
                    loop: this.wrapper.querySelector('.progress-loop'),
                    outro: this.wrapper.querySelector('.progress-outro')
                },
                labels: {
                    intro: this.wrapper.querySelector('.label-intro'),
                    loop: this.wrapper.querySelector('.label-loop'),
                    outro: this.wrapper.querySelector('.label-outro')
                },
                frameNums: {
                    start: this.wrapper.querySelector('.frame-num-start'),
                    loopStart: this.wrapper.querySelector('.frame-num-loop-start'),
                    loopEnd: this.wrapper.querySelector('.frame-num-loop-end'),
                    end: this.wrapper.querySelector('.frame-num-end')
                },
                markers: {
                    start: this.wrapper.querySelector('.marker-start'),
                    end: this.wrapper.querySelector('.marker-end')
                }
            };
        }

        buildTimeline() {
            if (!this.dotLottie || this.totalFrames === 0) return;

            if (this.isLooping) {
                const { frameNums, segments, markers } = this.ui;
                if (frameNums.start) frameNums.start.textContent = 0;
                if (frameNums.loopStart) frameNums.loopStart.textContent = this.loopStartFrame;
                if (frameNums.loopEnd) frameNums.loopEnd.textContent = this.loopEndFrame;
                if (frameNums.end) frameNums.end.textContent = this.totalFrames;

                const introPercent = (this.loopStartFrame / this.totalFrames) * 100;
                const loopPercent = ((this.loopEndFrame - this.loopStartFrame) / this.totalFrames) * 100;
                const outroPercent = 100 - introPercent - loopPercent;

                if (segments.intro) segments.intro.style.width = `${introPercent}%`;
                if (segments.loop) segments.loop.style.width = `${loopPercent}%`;
                if (segments.outro) segments.outro.style.width = `${outroPercent}%`;

                if (markers.start) markers.start.style.left = `${introPercent}%`;   
                if (markers.end) markers.end.style.left = `${introPercent + loopPercent}%`;

                if (frameNums.loopStart) frameNums.loopStart.style.left = `${introPercent}%`;
                if (frameNums.loopEnd) frameNums.loopEnd.style.left = `${introPercent + loopPercent}%`;
            } else {
                const { frameNums } = this.ui;
                if (frameNums.start) frameNums.start.textContent = 0;
                if (frameNums.end) frameNums.end.textContent = this.totalFrames;
            }
        }

        attachEventListeners() {
            this.containerDiv.addEventListener('mouseenter', this.onHoverStart.bind(this));
            this.containerDiv.addEventListener('mouseleave', this.onHoverEnd.bind(this));
            this.ui.themeToggle.addEventListener('change', this.onThemeChange.bind(this));
        }

        loadAnimationForTheme(isLight) {
            // If instance exists, destroy or reuse? 
            // DotLottie instances can load new src.
            const themeFolder = isLight ? 'White' : 'Black';
            const path = `Lotties/${themeFolder}/${this.animationData.fileName}`;

            if (!this.dotLottie) {
                this.dotLottie = new DotLottie({
                    canvas: this.canvas,
                    src: path,
                    loop: false,
                    autoplay: false,
                });
                
                // Attach event listeners to the instance
                this.dotLottie.addEventListener('load', this.boundOnLoad);
                this.dotLottie.addEventListener('frame', this.boundOnFrame);
                this.dotLottie.addEventListener('complete', this.boundOnComplete);
            } else {
                this.dotLottie.load({ src: path });
            }
        }

        onLoad() {
            // Wait a tick for totalFrames to be populated properly
            setTimeout(() => {
                this.totalFrames = Math.floor(this.dotLottie.totalFrames);
                this.dotLottie.setFrame(0);
                this.buildTimeline();
                this.resetTimeline();
            }, 50);
        }

        onFrame(event) {
            // event.currentFrame might be a float
            const currentFrame = Math.floor(event.currentFrame);
            this.updateTimelineUI(currentFrame, true);

            if (this.isLooping) {
                if (this.isOutroLocked) return;

                if (this.isHovering) {
                    // Manual Loop Logic
                    if (currentFrame >= this.loopEndFrame) {
                        this.dotLottie.setFrame(this.loopStartFrame);
                    }
                } else {
                    // Lock into Outro
                    if (currentFrame >= this.loopStartFrame) {
                        this.isOutroLocked = true;
                    }
                }
            }
        }

        onComplete() {
            if (this.animationType === 'playAndHold') {
                // DotLottie usually stops on its own, but we ensure UI is correct
                this.updateTimelineUI(this.totalFrames, false);
                this.wrapper.classList.remove('playing');
            } else {
                this.isOutroLocked = false;
                this.resetTimeline();
                
                if (this.isHovering) {
                    // If still hovering, restart from 0
                    this.dotLottie.setFrame(0);
                    this.dotLottie.play();
                } else {
                    this.dotLottie.setFrame(0);
                    this.wrapper.classList.remove('playing');
                }
            }
        }

        onHoverStart() {
            if (!this.dotLottie || !this.dotLottie.isLoaded) return;
            
            this.isHovering = true;
            this.wrapper.classList.add('playing');

            const currentFrame = Math.floor(this.dotLottie.currentFrame);

            // If it's effectively paused/stopped
            if (!this.dotLottie.isPlaying) {
                this.isOutroLocked = false;
                this.dotLottie.setFrame(0);
                this.dotLottie.play();
            } else if (this.isLooping && this.isOutroLocked && currentFrame <= this.loopEndFrame) {
                // Unlock if we catch it inside the loop
                this.isOutroLocked = false;
            } else {
                this.dotLottie.play();
            }
        }

        onHoverEnd() {
            this.isHovering = false;

            if (this.animationType === 'playAndHold') {
                this.isOutroLocked = false;
                this.dotLottie.setFrame(0);
                this.resetTimeline();
            } else {
                // Just let it play, logic in onFrame/onComplete handles the rest
                if(!this.dotLottie.isPlaying) {
                     this.dotLottie.play();
                }
            }
            this.wrapper.classList.remove('playing');
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

        resetTimeline() {
            if (this.isLooping) {
                if (this.ui.progress.intro) this.ui.progress.intro.style.width = '0%';
                if (this.ui.progress.loop) this.ui.progress.loop.style.width = '0%';
                if (this.ui.progress.outro) this.ui.progress.outro.style.width = '0%';
            } else {
                if (this.ui.progressFull) this.ui.progressFull.style.width = '0%';
            }
            this.updateTimelineUI(0, false);
        }

        updateTimelineUI(currentFrame, isPlaying) {
            if (this.ui.frameCounter) {
                this.ui.frameCounter.textContent = `Frame: ${currentFrame}`;
            }

            if (this.totalFrames === 0) return;

            const totalProgressPercent = (currentFrame / this.totalFrames) * 100;

            if (this.ui.playheadMarker) {
                this.ui.playheadMarker.style.left = `${totalProgressPercent}%`;
                this.ui.playheadMarker.style.opacity = isPlaying ? '1' : '0';
            }

            if (this.isLooping) {
                const { progress, labels, segments, frameNums } = this.ui;

                const introProgress = (currentFrame / this.loopStartFrame) * 100;
                const loopProgress = ((currentFrame - this.loopStartFrame) / (this.loopEndFrame - this.loopStartFrame)) * 100;
                const outroProgress = ((currentFrame - this.loopEndFrame) / (this.totalFrames - this.loopEndFrame)) * 100;

                if (progress.intro) progress.intro.style.width = `${Math.min(100, Math.max(0, introProgress))}%`;
                if (progress.loop) progress.loop.style.width = `${Math.min(100, Math.max(0, loopProgress))}%`;
                if (progress.outro) progress.outro.style.width = `${Math.min(100, Math.max(0, outroProgress))}%`;

                const allLabels = [labels.intro, labels.loop, labels.outro];
                const allSegments = [segments.intro, segments.loop, segments.outro];
                const allFrameNums = [frameNums.start, frameNums.loopStart, frameNums.loopEnd, frameNums.end];

                allLabels.forEach(el => el?.classList.remove('active'));
                allSegments.forEach(el => el?.classList.remove('active'));
                allFrameNums.forEach(el => el?.classList.remove('active'));

                if (!isPlaying) return;

                if (currentFrame < this.loopStartFrame) {
                    labels.intro?.classList.add('active');
                    segments.intro?.classList.add('active');
                    frameNums.start?.classList.add('active');
                } else if (currentFrame >= this.loopStartFrame && currentFrame <= this.loopEndFrame) {
                    labels.loop?.classList.add('active');
                    segments.loop?.classList.add('active');
                    frameNums.loopStart?.classList.add('active');
                    frameNums.loopEnd?.classList.add('active');
                } else {
                    labels.outro?.classList.add('active');
                    segments.outro?.classList.add('active');
                    frameNums.end?.classList.add('active');
                }
            } else {
                if (this.ui.progressFull) {
                    this.ui.progressFull.style.width = `${totalProgressPercent}%`;
                }
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
                titleEl.after(feedbackEl);
            }

            const timelineType = animationData.animationType === 'loop' ? 'loop' : 'simple';
            wrapper.dataset.timelineType = timelineType;

            wrapper.addEventListener('themeChange', (e) => {
                descriptionEl.classList.toggle('light-mode', e.detail.isLight);
            });
            
            gridContainer.appendChild(cardFragment);
            new LottieCard(wrapper, animationData);
        });
    }

    document.addEventListener('DOMContentLoaded', setupAnimationGrids);

})();