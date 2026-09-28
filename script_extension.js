// EXTENSION TO OVERRIDE RENDER LOGIC FOR TASK GROUPING

window.renderTaskBoardForOrder = function(orderId) {
    if (!orderId) {
        document.getElementById('tbProjectName').value = '';
        document.getElementById('tbModelsInfo').value = '';
        document.getElementById('tbTotalQty').value = '';
        document.getElementById('tbCustomer').value = '';
        document.getElementById('tbStartDate').value = '';
        document.getElementById('tbEndDate').value = '';
        document.getElementById('tbProgress').value = '';
        document.getElementById('tbStatus').value = '';
        
        document.getElementById('tbKpiTotal').textContent = '0';
        document.getElementById('tbKpiCompleted').textContent = '0';
        document.getElementById('tbKpiProgress').textContent = '0';
        document.getElementById('tbKpiPaused').textContent = '0';
        document.getElementById('tbKpiDelayed').textContent = '0';
        document.getElementById('tbKpiOverall').textContent = '0%';
        
        document.getElementById('tbTasksTableBody').innerHTML = '<tr id="tbEmptyRow"><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">Vui lòng chọn một Lệnh Sản Xuất ở trên để xem danh sách công việc.</td></tr>';
        const actionBtn = document.getElementById('tbActionButtons');
        if (actionBtn) actionBtn.classList.add('hidden');
        return;
    }
    
    const actionBtn = document.getElementById('tbActionButtons');
    if (actionBtn) actionBtn.classList.remove('hidden');
    
    const order = window.productionOrdersList.find(o => String(o['Số lệnh sản xuất'] || o['ID']) === String(orderId));
    if (!order) return;
    
    document.getElementById('tbProjectName').value = order['Số lệnh sản xuất'] || '';
    
    let modelsText = '';
    let totalQty = 0;
    if (window.parsedOrders) {
        const pOrder = window.parsedOrders.find(o => String(o.id) === String(orderId));
        if (pOrder && pOrder.products && pOrder.products.length > 0) {
            modelsText = pOrder.products.map(p => p.name + ' (SL: ' + p.qty + ')').join('\n');
            totalQty = pOrder.products.reduce((sum, p) => sum + (parseInt(p.qty) || 0), 0);
        } else if (order['Model']) {
            modelsText = order['Model'];
        }
    } else if (order['Model']) {
        modelsText = order['Model'];
    }
    const tbModelsInfo = document.getElementById('tbModelsInfo');
    if (tbModelsInfo) {
        tbModelsInfo.value = modelsText;
        tbModelsInfo.style.height = 'auto';
        tbModelsInfo.style.height = (tbModelsInfo.scrollHeight) + 'px';
    }
    
    const tbTotalQty = document.getElementById('tbTotalQty');
    if (tbTotalQty) tbTotalQty.value = totalQty;
    
    document.getElementById('tbCustomer').value = order['Khách hàng'] || '';
    
    const parseD = (d) => {
        if(!d) return '';
        const dt = new Date(d);
        return isNaN(dt.getTime()) ? d : `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
    };
    
    document.getElementById('tbStartDate').value = parseD(order['Ngày bắt đầu']) || '';
    document.getElementById('tbEndDate').value = parseD(order['Ngày kết thúc']) || parseD(order['Deadline']) || '';
    
    const overallProgress = order['Tiến độ'] || '0';
    document.getElementById('tbProgress').value = (typeof overallProgress === 'number' || !String(overallProgress).includes('%')) ? `${overallProgress}%` : overallProgress;
    document.getElementById('tbStatus').value = order['Trạng thái'] || 'Đang thực hiện';
    
    const tbody = document.getElementById('tbTasksTableBody');
    tbody.innerHTML = '';
    
    let totalTasks = 0;
    let completed = 0;
    let inProgress = 0;
    let paused = 0;
    let delayed = 0;
    
    if (order.tasks) totalTasks = order.tasks.length;
    
    const renderTaskRow = (task, index, container) => {
        const taskProgress = parseFloat(task['Tiến độ'] || task['Tiến độ Model'] || 0);
        if (taskProgress >= 100) completed++;
        else if (taskProgress > 0) inProgress++;
        
        let statusText = taskProgress >= 100 ? 'Hoàn thành' : (taskProgress > 0 ? 'Đang thực hiện' : 'Chưa bắt đầu');
        let statusStyle = taskProgress >= 100 ? 'color: #16a34a; background: #dcfce7;' : (taskProgress > 0 ? 'color: #0ea5e9; background: #e0f2fe;' : 'color: #64748b;');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 0.2rem;">${index + 1}</td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;"><input type="text" class="tb-input-name" value="${task['Tên công việc'] || task['Model'] || ''}" style="width: 100%; border: none; outline: none; background: transparent;"></td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;"><input type="text" class="tb-input-assignee" value="${task['Phụ trách'] || ''}" style="width: 100%; border: none; outline: none; background: transparent;"></td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;">Sản xuất</td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;"><input type="date" class="tb-input-start" value="${task['Ngày bắt đầu'] ? new Date(task['Ngày bắt đầu']).toISOString().split('T')[0] : ''}" style="width: 100%; border: none; outline: none; background: transparent; font-size: 0.8rem;"></td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;"><input type="date" class="tb-input-end" value="${task['Ngày kết thúc'] ? new Date(task['Ngày kết thúc']).toISOString().split('T')[0] : ''}" style="width: 100%; border: none; outline: none; background: transparent; font-size: 0.8rem;"></td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 0.2rem;">100%</td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;"><input type="number" class="tb-input-progress" value="${taskProgress}" min="0" max="100" style="width: 50px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 0.2rem; text-align: center;">%</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 0.2rem; font-weight: bold; color: ${taskProgress<100 ? '#dc2626' : '#16a34a'};"><span class="tb-progress-diff">${taskProgress - 100}</span>%</td>
            <td style="text-align: center; border: 1px solid #cbd5e1; padding: 0.2rem; ${statusStyle}">${statusText}</td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;">
                <select class="tb-input-priority" style="width: 100%; border: none; outline: none; background: transparent; font-size: 0.8rem;">
                    <option value="Bình thường">Bình thường</option>
                    <option value="Cao" style="color: red;">Cao</option>
                </select>
            </td>
            <td style="border: 1px solid #cbd5e1; padding: 0.2rem;">
                <div style="display: flex; gap: 0.2rem;">
                    <input type="text" class="tb-input-note" value="${task['Ghi chú'] || ''}" style="flex: 1; border: none; outline: none; background: transparent;">
                    <button class="btn btn-sm btn-outline tb-btn-delete" style="padding: 0.1rem 0.3rem; color: #dc2626; border-color: #dc2626;"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        `;
        
        const btnDelete = tr.querySelector('.tb-btn-delete');
        if (btnDelete) btnDelete.addEventListener('click', () => {
            tr.remove();
            if (container.querySelectorAll('tr:not(.tb-model-group-row)').length === 0) {
                container.innerHTML = '<tr id="tbEmptyRow"><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">Đơn hàng này chưa có công việc nào. Bấm "Thêm Dòng" để tạo công việc mới.</td></tr>';
            }
        });
        
        const progressInput = tr.querySelector('.tb-input-progress');
        if (progressInput) {
            progressInput.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value) || 0;
                const diffSpan = tr.querySelector('.tb-progress-diff');
                if (diffSpan) {
                    diffSpan.textContent = val - 100;
                    diffSpan.parentElement.style.color = val < 100 ? '#dc2626' : '#16a34a';
                }
            });
        }
        
        container.appendChild(tr);
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
                let minStart = null;
                let maxEnd = null;
                if (prod.tasks && prod.tasks.length > 0) {
                    prod.tasks.forEach(t => {
                        const sd = t['Ngày bắt đầu'] || t['startDate'];
                        const ed = t['Ngày kết thúc'] || t['endDate'] || t['Deadline'];
                        if (sd) {
                            const d = new Date(sd);
                            if (!isNaN(d.getTime())) {
                                if (!minStart || d < minStart) minStart = d;
                            }
                        }
                        if (ed) {
                            const d = new Date(ed);
                            if (!isNaN(d.getTime())) {
                                if (!maxEnd || d > maxEnd) maxEnd = d;
                            }
                        }
                    });
                }
                
                const formatD = (dateObj) => {
                    if (!dateObj) return '---';
                    return `${String(dateObj.getDate()).padStart(2,'0')}/${String(dateObj.getMonth()+1).padStart(2,'0')}/${dateObj.getFullYear()}`;
                };
                
                let dateStr = '';
                if (minStart || maxEnd) {
                    dateStr = ` &nbsp;|&nbsp; <i class="fa-regular fa-calendar"></i> Bắt đầu: ${formatD(minStart)} ➡️ Kết thúc: ${formatD(maxEnd)}`;
                } else if (prod.startDate || prod.endDate) {
                    dateStr = ` &nbsp;|&nbsp; <i class="fa-regular fa-calendar"></i> Bắt đầu: ${prod.startDate || '---'} ➡️ Kết thúc: ${prod.endDate || '---'}`;
                }
                groupTr.innerHTML = `<td colspan="12" style="padding: 0.5rem; text-align: left; border: 1px solid #cbd5e1; font-weight: 700; color: #0f172a;">
                    <i class="fa-solid fa-cube"></i> Model: ${prod.name} &nbsp;|&nbsp; Số lượng: ${prod.qty} <span style="color: #475569; font-weight: normal; font-size: 0.9rem;">${dateStr}</span>
                </td>`;
                tbody.appendChild(groupTr);
                
                if (prod.tasks && prod.tasks.length > 0) {
                    prod.tasks.forEach(task => renderTaskRow(task, globalIndex++, tbody));
                } else {
                    const emptyTr = document.createElement('tr');
                    emptyTr.innerHTML = `<td colspan="12" style="text-align: center; padding: 1rem; color: #94a3b8; font-style: italic;">Chưa có công việc cho Model này</td>`;
                    tbody.appendChild(emptyTr);
                }
            });
        }
    }
    
    if (!hasRendered && order.tasks && order.tasks.length > 0) {
        order.tasks.forEach((task, index) => renderTaskRow(task, index, tbody));
    } else if (!hasRendered) {
        tbody.innerHTML = '<tr id="tbEmptyRow"><td colspan="12" style="text-align: center; padding: 2rem; color: #64748b;">Đơn hàng này chưa có công việc nào. Bấm "Thêm Dòng" để tạo công việc mới.</td></tr>';
    }
    
    document.getElementById('tbKpiTotal').textContent = totalTasks;
    document.getElementById('tbKpiCompleted').textContent = completed;
    document.getElementById('tbKpiProgress').textContent = inProgress;
    document.getElementById('tbKpiPaused').textContent = paused;
    document.getElementById('tbKpiDelayed').textContent = delayed;
    document.getElementById('tbKpiOverall').textContent = document.getElementById('tbProgress').value;
};

window.jumpToTaskBoard = function(e, orderId) {
    if (e) e.stopPropagation();
    const taskTabBtn = document.querySelector('.prod-tab-btn[data-tab="prod-tasks"]');
    if (taskTabBtn) {
        taskTabBtn.click();
    }
    const select = document.getElementById('tbOrderSelect');
    if (select) {
        select.value = orderId;
        window.renderTaskBoardForOrder(orderId);
    }
};
