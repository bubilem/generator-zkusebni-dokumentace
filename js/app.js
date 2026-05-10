let currentTestData = null;

document.getElementById('json-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                currentTestData = JSON.parse(e.target.result);
                document.getElementById('info-title').textContent = currentTestData.title;
                document.getElementById('info-code').textContent = currentTestData.code;
                document.getElementById('test-info').style.display = 'block';
                
                document.getElementById('btn-sesit').disabled = false;
                document.getElementById('btn-arch').disabled = false;
                document.getElementById('btn-klic').disabled = false;
            } catch (err) {
                alert("Chyba při parsování JSON souboru.");
                console.error(err);
            }
        };
        reader.readAsText(file);
    }
});

function showPrintArea(html) {
    document.getElementById('app').style.display = 'none';
    const printArea = document.getElementById('print-area');
    printArea.innerHTML = html + '<div class="no-print" style="text-align: center; margin-top: 20px;"><button onclick="location.reload()" style="background:#dc3545; padding:10px 20px; border-radius:4px; color:white; border:none; cursor:pointer;">Zpět do menu</button></div>';
    printArea.style.display = 'block';
    
    // Provedeme typografickou úpravu textu (pevné mezery)
    applyTypographyFix(printArea);
}

document.getElementById('btn-sesit').addEventListener('click', () => {
    if (currentTestData) showPrintArea(generateBooklet(currentTestData));
});

document.getElementById('btn-arch').addEventListener('click', () => {
    if (currentTestData) showPrintArea(generateAnswerSheet(currentTestData, false));
});

document.getElementById('btn-klic').addEventListener('click', () => {
    if (currentTestData) showPrintArea(generateAnswerSheet(currentTestData, true));
});

function generateBooklet(data) {
    let html = `<div class="page booklet-layout">
        <h1 class="document-title">${data.title}<br><small>${data.code}</small></h1>
        <div class="instructions">
            <strong>Předmět:</strong> ${data.subject}<br>
            <strong>Úroveň:</strong> ${data.level}<br>
            <strong>Časový limit:</strong> ${data.timeLimit}<br>
            <strong>Pokyny:</strong> ${data.instructions}
        </div>`;

    let globalQNum = 1;

    data.parts.forEach((part, partIndex) => {
        html += `<h2 class="section-title">${data.parts.length > 1 ? `Část ${partIndex + 1}: ` : ''}${part.title}</h2>`;

        // Uzavřené otázky
        part.closedQuestions.forEach(q => {
            html += `
            <div class="q-container">
                <div class="q-number">${globalQNum}.</div>
                <div class="q-content">${q.text} <span class="open-points">(${q.points || 1} b.)</span>
                    <ol class="options">`;
            q.options.forEach(opt => {
                html += `<li>${opt}</li>`;
            });
            html += `</ol>
                </div>
            </div>`;
            globalQNum++;
        });

        // Otevřené otázky
        part.openQuestions.forEach(q => {
            html += `
            <div class="q-container">
                <div class="q-number">${globalQNum}.</div>
                <div class="q-content">
                    ${q.text} <span class="open-points">(${q.points} b.)</span>
                </div>
            </div>`;
            globalQNum++;
        });

        if (partIndex < data.parts.length - 1) {
            html += `<div class="page-break"></div>`;
        }
    });

    html += `<div class="end-test">--- Konec testu ---</div></div>`;
    return html;
}

function generateAnswerSheet(data, isKey) {
    let html = `<div class="page arch-layout">
        <div class="grid-container">`;

    // Úvodní část a hodnocení
    html += `
        <div>
            <h1 style="margin-top: 0; ${isKey ? 'color: red;' : ''}">ZÁZNAMOVÝ ARCH</h1>
            <div class="info-box ${isKey ? 'key' : ''}">
                <div style="grid-column: 1 / -1;"><strong>Jméno a příjmení:</strong> <br><br>
                    ${isKey ? '<span class="key-text" style="font-size: 14pt;">KLÍČ SPRÁVNÝCH ŘEŠENÍ</span>' : '<input type="text" style="width: 95%;">'}
                </div>
                <div><strong>Třída / Ročník:</strong> <br><br><input type="text" ${isKey ? 'disabled' : ''}></div>
                <div><strong>Datum:</strong> <br><br><input type="text" ${isKey ? 'disabled' : ''}></div>
            </div>
            
            <p><strong>Pokyny:</strong> ${isKey ? 'Toto je autorské řešení určené pro učitele jako šablona (klíč) pro opravu.' : 'U uzavřených úloh křížkem (X) označte správnou odpověď do příslušného čtverečku. Pokud se spletete, políčko začerněte a křížek udělejte do nového. U otevřených úloh vepište odpověď čitelně do vyhrazeného prostoru.'}</p>

            <h2>Hodnocení</h2>
            <table style="margin-top: 20px;">
                <tr>
                    <th>Část</th>
                    <th>Max. bodů</th>
                    <th>Dosaženo</th>
                </tr>`;
    
    let totalMax = 0;
    data.parts.forEach((part, idx) => {
        let maxPts = part.closedQuestions.reduce((acc, q) => acc + (q.points || 1), 0) + part.openQuestions.reduce((acc, q) => acc + (q.points || 2), 0);
        totalMax += maxPts;
        if (data.parts.length > 1) {
            html += `
                <tr>
                    <td>${idx + 1}. ${part.shortTitle || part.title}</td>
                    <td>${maxPts} b.</td>
                    <td>${isKey ? maxPts : ''}</td>
                </tr>`;
        }
    });

    html += `
                <tr>
                    <th>Celkem</th>
                    <th>${totalMax} b.</th>
                    <th>${isKey ? totalMax : ''}</th>
                </tr>
                <tr>
                    <th style="font-size: 1.1em; padding: 40px 0;">Výsledná známka</th>
                    <th colspan="2" style="${isKey ? 'color: red; font-size: 1.2em;' : ''}">${isKey ? 'A (1)' : ''}</th>
                </tr>
            </table>
            <div style="margin-top: 160px; border-top: 1px solid #000; padding-top: 10px; text-align: center;">
                datum a podpis hodnotitele
            </div>
        </div>`;

    // Jednotlivé části tabulky
    let globalQNum = 1;
    data.parts.forEach((part, idx) => {
        html += `
        <div class="${idx > 0 && idx % 2 !== 0 ? 'page-break-before' : ''}">
            <h2>${data.parts.length > 1 ? `Část ${idx + 1}: ` : ''}${part.shortTitle || part.title}</h2>
            <table>
                <tr>
                    <th class="q-number" rowspan="2">Úloha</th>
                    <th colspan="4">Odpověď</th>
                    <th class="points" rowspan="2">Body</th>
                </tr>
                <tr>
                    <th style="width: 25px;">A</th>
                    <th style="width: 25px;">B</th>
                    <th style="width: 25px;">C</th>
                    <th style="width: 25px;">D</th>
                </tr>`;
        
        const opts = ["A", "B", "C", "D"];
        part.closedQuestions.forEach(q => {
            html += `<tr><td class="q-number">${globalQNum}</td>`;
            opts.forEach(opt => {
                if (isKey && q.correctAnswer === opt) {
                    html += `<td style="color: red; font-weight: bold;">X</td>`;
                } else {
                    html += `<td></td>`;
                }
            });
            html += `<td class="points">${q.points || 1} b.</td></tr>`;
            globalQNum++;
        });

        html += `<tr><th colspan="6">Otevřené úlohy</th></tr>`;
        
        part.openQuestions.forEach(q => {
            let ansHtml = isKey ? q.correctAnswer : '';
            const customHeight = document.getElementById('height-input') ? document.getElementById('height-input').value : 75;
            html += `<tr><td class="q-number">${globalQNum}</td><td colspan="4" class="open-answer ${isKey ? 'key' : ''}" style="height: ${customHeight}px;">${ansHtml}</td><td class="points">${q.points} b.</td></tr>`;
            globalQNum++;
        });

        html += `</table></div>`;
    });

    html += `</div></div>`;
    return html;
}

// Typografická úprava z původního skriptu
function applyTypographyFix(element) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    const regex = /(^|[\\s\\(\\[\\{])([vkszouaiVKSZOUAI])\\s+/g;
    while (node = walker.nextNode()) {
        if (node.nodeValue.trim() !== '' && node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
            let text = node.nodeValue;
            text = text.replace(regex, '$1$2\u00A0').replace(regex, '$1$2\u00A0');
            if (node.nodeValue !== text) {
                node.nodeValue = text;
            }
        }
    }
}
