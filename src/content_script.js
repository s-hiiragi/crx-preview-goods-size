const displaySettings = [
    { width: 1920, height: 1080, diagonalInch: 23.8 },
    { width: 2560, height: 1440, diagonalInch: 27.9 }, /* 150% */
    { width: 3840, height: 2160, diagonalInch: 27.9 },
];

function getRealDevicePixelRatio() {
    const screenW = window.screen.width;
    const screenH = window.screen.height;
    const matchedSettings = displaySettings.filter(s => s.width === screenW && s.height === screenH);
    if (matchedSettings.length === 0) {
        return null;
    }
    const diagonalPixels = Math.sqrt(Math.pow(screenW, 2) + Math.pow(screenH, 2));
    const realDpi = diagonalPixels / matchedSettings[0].diagonalInch;
    const cssDpi = 96;
    const ratio = cssDpi / realDpi;
    return ratio;
}

const realDevicePixelRatio = getRealDevicePixelRatio();

function parseSizeText(text) {
    const sizePatterns = [
        /W(?<W>\d+(?:\.\d+)?)[^.\d]+H(?<H>\d+(?:\.\d+)?)[^.\d]+D(?<D>\d+(?:\.\d+)?)(?<U>mm|cm)?/,
        /(?<H>\d+(?:\.\d+)?)[^.\d]+(?<W>\d+(?:\.\d+)?)[^.\d]+(?<D>\d+(?:\.\d+)?)(?<U>mm|cm)?/,
        /W(?<W>\d+(?:\.\d+)?)[^.\d]+H(?<H>\d+(?:\.\d+)?)(?<D>)(?<U>mm|cm)?/,
        /(?<H>\d+(?:\.\d+)?)[^.\d]+(?<W>\d+(?:\.\d+)?)(?<D>)(?<U>mm|cm)?/,
    ];

    let sizeInfo = null;

    for (const p of sizePatterns) {
        const m = p.exec(text);
        if (m) {
            sizeInfo = {
                width : Number(m.groups.W) * (m.groups.U === 'cm' ? 10 : 1),
                height: Number(m.groups.H) * (m.groups.U === 'cm' ? 10 : 1),
                depth : Number(m.groups.D) * (m.groups.U === 'cm' ? 10 : 1)
            };
            break;
        }
    }

    return sizeInfo;
}

function convertMmToPhysical(mm) {
    return mm / realDevicePixelRatio;
}

function showPhysicalSizeBox(sizeInfo) {
    const w = convertMmToPhysical(sizeInfo.width);
    const h = convertMmToPhysical(sizeInfo.height);

    const root = document.createElement('div');
    root.style.cssText = `
    position: fixed;
    inset: 0% 100% 100% 0%;
    width: 100%;
    height: 100%;
    align-items: center;
    z-index: 65535;
    background-color: #00000080;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
    --w: ${w}mm;
    --h: ${h}mm;
    position: absolute;
    left: calc((100% - var(--w)) / 2);
    top: calc((100% - var(--h)) / 2);
    display: inline-block;
    width: var(--w);
    height: var(--h);
    border: 1px solid black;
    background-color: #ffffc6;
    `;

    box.innerHTML = `
        <input class="rotate" type="button" value="回転">
        <span class="size-text"></span>
    `;

    const sizeText = box.querySelector('.size-text');
    sizeText.textContent = `H${sizeInfo.height}mm × W${sizeInfo.width}mm`;

    const rotateButton = box.querySelector('.rotate');
    rotateButton.onclick = (e) => {
        const w = box.style.getPropertyValue('--w');
        const h = box.style.getPropertyValue('--h');
        box.style.setProperty('--w', h);
        box.style.setProperty('--h', w);
    };

    root.onclick = (e) => {
        if (e.target === box || e.target === root) {
            //e.currentTarget.remove();
            root.remove();
        }
    };

    root.appendChild(box);
    document.body.appendChild(root);
}

function onMessage(message, sender, sendResponse) {
    const text = message.selectionText;
    const sizeInfo = parseSizeText(text);
    if (!sizeInfo) {
        alert('非対応の寸法サイズ形式です');
        return;
    }
    if (!realDevicePixelRatio) {
        alert(`ディスプレイ設定が見つかりません (width: ${window.screen.width}, height: ${window.screen.height})`);
        return;
    }
    showPhysicalSizeBox(sizeInfo);
}

chrome.runtime.onMessage.addListener(onMessage);
