import { data, texts } from './data.js';

let selectedLanguage;
let isPlaying = false;
let textIndex = 0;
let textsArray;
let textsAmount;
let displayingTxt = 0;
let warningShown = false;
let started = false;
let talkTextStartFrom = 0;
let continueAdviceGiven = false;

const LOOP_INTERVAL = 3000;
const TIME_TO_PLAY_SONG = 7000;
const RENDER_SPEED = 65;
const desktopOrMobile = window.innerWidth < 768 ? 'mobile' : 'desktop';

window.onload = async () => {
    let audioDiv = document.querySelector('#sounds');
    await loadSounds(audioDiv);
	let toHideSpinner = Math.floor(Math.random() * 2000) + 1000;
	setTimeout(() => {
		elements.languageSelection.style.display = 'flex';
		hideLoading();
	}, toHideSpinner);
}

async function loadSounds(container){
	let sounds = data.map(item => item.language);
	let soundsHtml = '';
	sounds.forEach(sound=>{
		let id = sound.toLowerCase();
		id = id.replace(' ', '-');
		soundsHtml += `<audio id="${id}" src="sounds/${sound}.mp3"></audio>`;
	})
	container.innerHTML = soundsHtml;
}

const elements = {
    ptButton: document.querySelector('#portugueseBtn'),
    enButton: document.querySelector('#englishBtn'),
    preloader: document.querySelector('#preloader'),
	languageSelection: document.querySelector('#language-selection'),
	loadingIcon: document.querySelector('#spinner'),
    ambientAudio: document.querySelector('#bg-audio'),
    talk: document.querySelector('#talk'),
    container: document.querySelector('.container'),
    phraseDiv: document.querySelector('#phrase'),
    continueDiv: document.querySelector('#continue'),
	container2: document.querySelector('.container2'),
};

elements.talk.volume = 1;
elements.ptButton.addEventListener('click', () => handleSelectedLanguage('pt'));
elements.enButton.addEventListener('click', () => handleSelectedLanguage('en'));

function handleSelectedLanguage(lang) {
    selectedLanguage = lang;
    elements.preloader.style.display = 'none';
    elements.container.style.opacity = 1;
    textsArray = texts[selectedLanguage];
    textsAmount = textsArray.length;
    renderAsDialog(textsArray[textIndex]);

    const eventType = desktopOrMobile === 'desktop' ? 'keyup' : 'touchend';
    window.addEventListener(eventType, handleTextNext);
}

function handleTextNext(e) {
    if (isPlaying  || started || (e.code !== 'Space' && e.type !== 'touchend')) return;
    
    talkTextStartFrom = elements.talk.currentTime + 1.5;
    warningShown = true;
    elements.continueDiv.innerHTML = '';

    if (displayingTxt < textsAmount) {
        elements.phraseDiv.textContent = '';
        renderAsDialog(textsArray[++textIndex]);
    } else {
        resetUIForNext();
    }
}

function resetUIForNext() {
	if(started)return;
    elements.continueDiv.innerHTML = '';
    elements.phraseDiv.innerHTML = '';
    document.querySelectorAll('.temp').forEach(item => item.style.display = 'none');
    elements.ambientAudio.currentTime = 1;
    elements.ambientAudio.play();
	started = true;
    setTimeout(() => {
        elements.ambientAudio.volume = 0.5;
        start();
    }, TIME_TO_PLAY_SONG);
}

function renderAsDialog(text) {
    isPlaying = true;
    elements.talk.currentTime = talkTextStartFrom;
    elements.talk.play();
    let i = 0;

    const loop = setInterval(() => {
        if (i >= text.length) {
            elements.talk.pause();
            isPlaying = false;
            showInput();
            clearInterval(loop);
            displayingTxt++;
        } else {
            elements.phraseDiv.textContent += text[i++];
        }
    }, RENDER_SPEED);
}

function hideLoading() {
	elements.languageSelection.opacity = 1;
    elements.loadingIcon.parentNode.removeChild(elements.loadingIcon);
}

function showInput() {
    elements.phraseDiv.innerHTML += '<span> _</span>';
    const span = elements.phraseDiv.querySelector('span');

    setInterval(() => {
        span.style.opacity = span.style.opacity == 0 ? 1 : 0;
    }, 100);

    setTimeout(() => {
        if (warningShown) return;

        const continueMsg = selectedLanguage === 'pt'
            ? (desktopOrMobile === 'desktop' ? 'Pressione a barra de espaço para continuar' : 'Clique para continuar')
            : (desktopOrMobile === 'desktop' ? 'Press the space bar to continue' : 'Tap to continue');

        elements.continueDiv.innerHTML += `<br><span>${continueMsg}</span>`;
        warningShown = true;
    }, 15000);
}

function start() {
    started = true;
    const randomizedArray = setFirstSecondAndRandomize(data);
    elements.container.style.opacity = 1;
    document.querySelector('button').style.opacity = 0;
    const wordDiv = document.querySelector('#word');
    const languageDiv = document.querySelector('#language');
    let i = 0;
    let touchCooldown = false; 

    if (desktopOrMobile === 'desktop') {
        
        const loop = setInterval(() => {
            if (i >= randomizedArray.length) {
                clearInterval(loop);
                wordDiv.textContent = '';
                languageDiv.textContent = '';
                finish();
            } else {
                const { icon, word, language, idioma } = randomizedArray[i];
                wordDiv.textContent = word;
                languageDiv.textContent = `${icon} ${selectedLanguage === 'pt' ? idioma : language} ${icon}`;
                let keyWord = language.toLowerCase();
                keyWord = keyWord.replace(' ', '-');
                let audio = document.getElementById(keyWord);
                audio.play();
                i++;
            }
        }, LOOP_INTERVAL);
    } else {
        handleContinue(true);
        function handleNextItem() {
            if (touchCooldown) return; 
            touchCooldown = true;
            setTimeout(() => {
				handleContinue(true);
                touchCooldown = false;
            }, 3000);
			handleContinue(false);
            if (i >= randomizedArray.length) {
                wordDiv.textContent = '';
                languageDiv.textContent = '';
                finish();
                window.removeEventListener('touchend', handleNextItem); 
            } else {
                const { icon, word, language, idioma } = randomizedArray[i];
                wordDiv.textContent = word;
                languageDiv.textContent = `${icon} ${selectedLanguage === 'pt' ? idioma : language} ${icon}`;
                let keyWord = language.toLowerCase();
                keyWord = keyWord.replace(' ', '-');
                let audio = document.getElementById(keyWord);
                audio.play();
                i++;
            }
        }
        window.addEventListener('touchend', handleNextItem);
    }
}

function handleContinue(display) {
	let continueTxt = document.getElementById('continueMobile');
	let interval;
	if(display){
		let continueLabel = selectedLanguage === 'pt' ? 'Toque para continuar' : 'Tap to continue';
		continueTxt.innerHTML = continueLabel;
	}
	else{
		clearInterval(interval);
		continueTxt.innerHTML = '';
	}
}
function finish() {
    const restartBtn = document.querySelector('#restart');
	let allH3 = document.querySelectorAll('h3');
	allH3.forEach(h3 => h3.style.display = 'none');
	if(selectedLanguage === 'pt') {
		restartBtn.textContent = 'Reiniciar';
	}
	if(selectedLanguage === 'en') {
    	restartBtn.textContent = 'Restart';
	}
    restartBtn.style.display = 'block';
	restartBtn.addEventListener('click', () => {
		if(selectedLanguage === 'pt') {
			restartBtn.textContent = 'Reiniciando...';
		}
		if(selectedLanguage === 'en') {
			restartBtn.textContent = 'Restarting...';
		}
		let resetAudio = document.querySelector('#reset-audio');
		resetAudio.currentTime = 1;
		resetAudio.play();
		setTimeout(() => {
			window.location.reload();
		}, 3000);
	});
}

function setFirstSecondAndRandomize(data) {
    let randomizedArray = [];
    const selectedLanguages = selectedLanguage === 'pt' ? ['brazilian portuguese', 'portuguese'] : ['english'];

    selectedLanguages.forEach(lang => {
        const item = data.find(item => item.language.toLowerCase() === lang);
        if (item) randomizedArray.push(item);
        data = data.filter(item => item.language.toLowerCase() !== lang);
    });

    for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
    }

    return randomizedArray.concat(data);
}
