$content = Get-Content -Path "script.js" -Raw -Encoding UTF8

$search = @"
    if (order.tasks && order.tasks.length > 0) {
        totalTasks = order.tasks.length;
        order.tasks.forEach((task, index) => {
"@

$replace = @"
    if (order.tasks) totalTasks = order.tasks.length;
    
    const renderTaskRow = (task, index, trContainer) => {
"@

$content = $content.Replace($search, $replace)


$search2 = @"
            const btnDelete = tr.querySelector('.tb-btn-delete');
            if (btnDelete) btnDelete.addEventListener('click', () => tr.remove());
"@

$replace2 = @"
            const btnDelete = tr.querySelector('.tb-btn-delete');
            if (btnDelete) btnDelete.addEventListener('click', () => {
                tr.remove();
                if (trContainer.querySelectorAll('tr:not(.tb-model-group-row)').length === 0) {
                    trContainer.innerHTML = '<tr id="tbEmptyRow"><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">ÄÆ¡n hÃ ng nÃ y chÆ°a cÃ³ cÃ´ng viá»‡c nÃ o. Báº¥m "ThÃªm DÃ²ng" Ä‘á»ƒ táº¡o cÃ´ng viá»‡c má»›i.</td></tr>';
                }
            });
"@

$content = $content.Replace($search2, $replace2)


$search3 = @"
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = '<tr id="tbEmptyRow"><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">ÄÆ¡n hÃ ng nÃ y chÆ°a cÃ³ cÃ´ng viá»‡c nÃ o. Báº¥m "ThÃªm DÃ²ng" Ä‘á»ƒ táº¡o cÃ´ng viá»‡c má»›i.</td></tr>';
    }
"@

$replace3 = @"
            trContainer.appendChild(tr);
    };

    let hasRendered = false;
    if (window.parsedOrders) {
        const pOrder = window.parsedOrders.find(o => String(o.id) === String(orderId));
        if (pOrder && pOrder.products && pOrder.products.length > 0) {
            hasRendered = true;
            let globalIndex = 0;
            pOrder.products.forEach(prod => {
                const groupTr = document.createElement('tr');
                groupTr.className = 'tb-model-group-row';
                groupTr.style.background = '#f1f5f9';
                groupTr.innerHTML = '<td colspan="12" style="padding: 0.5rem; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;"><i class="fa-solid fa-cube"></i> Model: ' + prod.name + ' &nbsp;|&nbsp; Sá»‘ lÆ°á»£ng: ' + prod.qty + '</td>';
                tbody.appendChild(groupTr);
                
                if (prod.tasks && prod.tasks.length > 0) {
                    prod.tasks.forEach(task => renderTaskRow(task, globalIndex++, tbody));
                }
            });
        }
    }
    
    if (!hasRendered && order.tasks && order.tasks.length > 0) {
        order.tasks.forEach((task, index) => renderTaskRow(task, index, tbody));
    } else if (!hasRendered) {
        tbody.innerHTML = '<tr id="tbEmptyRow"><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">ÄÆ¡n hÃ ng nÃ y chÆ°a cÃ³ cÃ´ng viá»‡c nÃ o. Báº¥m "ThÃªm DÃ²ng" Ä‘á»ƒ táº¡o cÃ´ng viá»‡c má»›i.</td></tr>';
    }
"@

$content = $content.Replace($search3, $replace3)

Set-Content -Path "script.js" -Value $content -NoNewline -Encoding UTF8
