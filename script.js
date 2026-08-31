/**
 * GT-360 | Main Application Script
 */

// API Endpoint từ Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwi4AiULoxuo8RT38cvGQeXSXkO0Bjrkns3ad6NkK6051Oj-ihqIrMJ7y-DUFpIuG0w/exec';

document.addEventListener('DOMContentLoaded', () => {
    try {
    // DOM Elements
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('pageTitle');

    // Toggle Sidebar (Mobile & Desktop)
    function toggleSidebarAction() {
        sidebar.classList.toggle('collapsed');
        if (window.innerWidth <= 992) {
            if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebarAction);
    }
    
    const sidebarToggleInside = document.getElementById('sidebarToggleInside');
    if (sidebarToggleInside) {
        sidebarToggleInside.addEventListener('click', toggleSidebarAction);
    }

    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.add('collapsed');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Navigation Logic
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');

            // Update Page Title based on sidebar text
            const titleText = item.querySelector('span').innerText;
            if (pageTitle) {
                pageTitle.innerText = titleText;
            }

            // Get target section ID
            const targetId = item.getAttribute('data-target');

            // Hide all sections, show target section
            contentSections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });

            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 992) {
                sidebar.classList.add('collapsed');
                if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            }
        });
    });

    // ==========================================
    // API & DATA SYNC LOGIC
    // ==========================================
    
    // Nút Sync Data (Đồng bộ)
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');
    
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            const icon = syncBtn.querySelector('i');
            icon.classList.add('fa-spin'); // Add spinning animation
            
            if (syncStatus) {
                syncStatus.innerText = 'Syncing...';
                syncStatus.style.color = 'var(--gray-500)';
            }
            
            try {
                // Ví dụ: Load dữ liệu khách hàng
                await loadCRMData();
                
                if (syncStatus) {
                    syncStatus.innerText = 'Synced';
                    syncStatus.style.color = 'var(--success)';
                }
            } catch (error) {
                console.error("Lỗi đồng bộ:", error);
                
                if (syncStatus) {
                    syncStatus.innerText = 'Failed';
                    syncStatus.style.color = 'var(--danger)';
                }
            } finally {
                icon.classList.remove('fa-spin');
            }
        });
    }

    // Hàm gọi API GET chung
    async function fetchFromGoogle(action) {
        try {
            const response = await fetch(`${SCRIPT_URL}?action=${action}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`Error fetching ${action}:`, error);
            throw error;
        }
    }

    // Tải dữ liệu CRM
    async function loadCRMData() {
        const result = await fetchFromGoogle('getCustomers');
        if (result.status === 'success') {
            renderCRMTable(result.data);
        } else {
            console.error("Lỗi từ server:", result.message);
        }
    }

    // Render bảng CRM
    function renderCRMTable(data) {
        const tbody = document.getElementById('crmTableBody');
        if (!tbody) return;
        
        // Update capacity bar
        updateCapacityBar(data ? data.length : 0);

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có dữ liệu.</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        data.forEach((row, index) => {
            // Giả sử row có các trường: ID, Tên, Liên hệ, Trạng thái, Link Drive
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${row.ID || index + 1}</td>
                <td><strong>${row['Tên'] || ''}</strong></td>
                <td>${row['Liên hệ'] || ''}</td>
                <td><span class="status-badge status-caring">${row['Trạng thái'] || 'Mới'}</span></td>
                <td>
                    ${row['Link Drive'] ? `<a href="${row['Link Drive']}" class="drive-link" target="_blank"><i class="fa-brands fa-google-drive"></i> Xem file</a>` : '-'}
                </td>
                <td>
                    <button class="action-btn edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete-btn"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ==========================================
    // SYSTEM CAPACITY LOGIC
    // ==========================================
    function updateCapacityBar(totalRows) {
        const MAX_SAFE_ROWS = 10000;
        const capacityText = document.getElementById('capacityText');
        const capacityFill = document.getElementById('capacityFill');
        
        if (!capacityText || !capacityFill) return;

        let percentage = (totalRows / MAX_SAFE_ROWS) * 100;
        if (percentage > 100) percentage = 100;
        
        // Hiển thị phần trăm với 2 số thập phân nếu quá bé, hoặc làm tròn
        const displayPercent = percentage < 1 && percentage > 0 ? percentage.toFixed(2) : Math.round(percentage);
        
        capacityText.innerText = `${displayPercent}%`;
        capacityFill.style.width = `${percentage}%`;

        // Đổi màu tùy theo mức độ
        capacityFill.className = 'progress-fill'; // reset
        if (percentage < 50) {
            capacityFill.classList.add('bg-green');
        } else if (percentage < 80) {
            capacityFill.classList.add('bg-orange');
        } else {
            capacityFill.classList.add('bg-red');
        }
    }

    // ==========================================
    // GANTT CHART LOGIC (PRODUCTION)
    // ==========================================
    window.ganttBaseDate = null;
    window.GANTT_TOTAL_DAYS = 35;

    const ganttSidebarBody = document.getElementById('ganttSidebarBody');
    const ganttTimelineHeader = document.getElementById('ganttTimelineHeader');
    const ganttTimelineBody = document.getElementById('ganttTimelineBody');
    const ganttTimeline = document.querySelector('.gantt-timeline');

    // Đồng bộ thao tác cuộn dọc giữa timeline và sidebar
    if (ganttTimeline && ganttSidebarBody) {
        ganttTimeline.addEventListener('scroll', () => {
            ganttSidebarBody.scrollTop = ganttTimeline.scrollTop;
        });
    }

    // Khởi tạo lưới thời gian (động)
    function initGanttGrid(baseDate, totalDays) {
        if (!ganttTimelineHeader || !ganttTimelineBody) return;
        
        ganttTimelineHeader.innerHTML = '';
        ganttTimelineBody.innerHTML = ''; // Đảm bảo xóa sạch các thanh cũ trước khi vẽ lại
        
        const today = new Date();
        today.setHours(0,0,0,0);

        if (!baseDate) {
            baseDate = new Date(today);
            baseDate.setDate(baseDate.getDate() - 5); // Bắt đầu từ 5 ngày trước
        }
        if (!totalDays) totalDays = 30;

        const CELL_WIDTH = 40; // px
        let html = '';

        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(baseDate);
            currentDate.setDate(baseDate.getDate() + i);
            
            const isToday = currentDate.getTime() === today.getTime();
            const dayName = currentDate.toLocaleDateString('vi-VN', { weekday: 'short' });
            const dateNum = currentDate.getDate();

            html += `
                <div class="gantt-date-cell ${isToday ? 'today' : ''}" data-date="${currentDate.toISOString().split('T')[0]}">
                    <span>${dayName}</span>
                    <span>${dateNum}</span>
                </div>
            `;
        }
        ganttTimelineHeader.innerHTML = html;
        
        // Vẽ đường hiển thị hôm nay
        const diffToday = today.getTime() - baseDate.getTime();
        const diffDaysToday = Math.floor(diffToday / (1000 * 3600 * 24));
        
        if (diffDaysToday >= 0 && diffDaysToday < totalDays) {
            const todayLine = document.createElement('div');
            todayLine.className = 'today-line';
            todayLine.style.left = `${diffDaysToday * CELL_WIDTH + (CELL_WIDTH/2)}px`; 
            ganttTimelineBody.appendChild(todayLine);
        }
    }

    // Render danh sách Đơn hàng (Gantt)
    function renderGanttOrders(orders, baseDate, totalDays = 35) {
        if (!ganttSidebarBody || !ganttTimelineBody) return;
        
        let sidebarHtml = '';
        let timelineHtml = '';
        const CELL_WIDTH = 40;
        
        // Base Date để tính tọa độ
        if (!baseDate) {
            const now = new Date();
            baseDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const maxDate = new Date(baseDate);
        maxDate.setDate(baseDate.getDate() + totalDays);

        const statusFilter = document.getElementById('ganttStatusFilter') ? document.getElementById('ganttStatusFilter').value : 'all';

        // Lọc các đơn hàng giao thoa với khoảng nhìn 35 ngày
        const visibleOrders = orders.filter(order => {
            if (!order.startDate || !order.endDate) return false;
            
            if (statusFilter === 'completed' && order.status !== 'Hoàn thành') return false;
            if (statusFilter === 'progress' && order.status === 'Hoàn thành') return false;

            const startD = new Date(order.startDate);
            startD.setHours(0,0,0,0);
            const endD = new Date(order.endDate);
            endD.setHours(23,59,59,999);
            return startD <= maxDate && endD >= baseDate;
        });

        const formatShortDate = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        visibleOrders.forEach((order, index) => {
            const isCompleted = order.status === 'Hoàn thành';
            const bgStyle = isCompleted ? 'background-color: var(--success-light);' : '';
            // Tính toán độ dài thanh (Bar)
            const startD = new Date(order.startDate);
            startD.setHours(0,0,0,0);
            const endD = new Date(order.endDate);
            endD.setHours(0,0,0,0);

            // Tính vị trí Left (từ baseDate)
            const diffTimeLeft = startD.getTime() - baseDate.getTime();
            const diffDaysLeft = Math.floor(diffTimeLeft / (1000 * 3600 * 24));
            const leftPx = diffDaysLeft * CELL_WIDTH;

            // Tính độ dài Width
            let diffDaysWidth = Math.floor((endD.getTime() - startD.getTime()) / (1000 * 3600 * 24)) + 1;
            if (diffDaysWidth < 1) diffDaysWidth = 1; // Tối thiểu 1 ngày
            const widthPx = diffDaysWidth * CELL_WIDTH;

            // Determine time elapsed and progress
            const today = new Date();
            today.setHours(0,0,0,0);
            
            let trackingDate = today;
            if (order.status === 'Hoàn thành') {
                if (order.actualFinishDate) {
                    trackingDate = new Date(order.actualFinishDate);
                    trackingDate.setHours(0,0,0,0);
                } else {
                    trackingDate = endD;
                }
            }

            let timeColorClass = 'progress-green';
            let elapsedPercent = 0;
            
            if (trackingDate >= endD) {
                elapsedPercent = 100;
            } else if (trackingDate > startD) {
                const diffTimeElapsed = trackingDate.getTime() - startD.getTime();
                const diffDaysElapsed = Math.floor(diffTimeElapsed / (1000 * 3600 * 24)) + 1;
                elapsedPercent = Math.round((diffDaysElapsed / diffDaysWidth) * 100);
            }
            
            if (elapsedPercent < 60) {
                timeColorClass = 'progress-green';
            } else if (elapsedPercent >= 60 && elapsedPercent < 85) {
                timeColorClass = 'progress-yellow';
            } else {
                timeColorClass = 'progress-red';
            }

            if (order.statusClass === 'status-done') {
                timeColorClass = 'status-done';
            }

            // Calculate total progress
            let totalWeightedProgress = 0;
            if (order.totalQty > 0 && order.products && order.products.length > 0) {
                let sum = 0;
                order.products.forEach(p => {
                    let pProg = isNaN(p.prog) ? 0 : p.prog;
                    sum += p.qty * pProg;
                });
                totalWeightedProgress = Math.round(sum / order.totalQty);
                if (isNaN(totalWeightedProgress)) totalWeightedProgress = 0;
            }
            if (totalWeightedProgress === 0 && order.progress > 0) {
                totalWeightedProgress = order.progress;
            }

            let displayProgress = totalWeightedProgress;

            let orderFlagColor = 'var(--success)';
            let orderProgColor = 'var(--primary)';
            if (order.endDate) {
                const endD = new Date(order.endDate);
                endD.setHours(0,0,0,0);
                const actualD = (order.progress === 100 && order.actualFinishDate) ? new Date(order.actualFinishDate) : new Date();
                actualD.setHours(0,0,0,0);
                if (actualD > endD) {
                    orderProgColor = 'var(--danger)';
                    if (order.progress === 100) orderFlagColor = 'var(--danger)';
                } else {
                    if (order.progress === 100) orderProgColor = 'var(--success)';
                }
            }

            // Render Sidebar Row
            sidebarHtml += `
                <div class="gantt-sidebar-group">
                    <div class="gantt-info-row" style="cursor: pointer; ${bgStyle}" onclick="window.toggleGanttRow('${order.id.replace(/'/g, "\\'")}', this.querySelector('.gantt-toggle-btn'))">
                        <button class="gantt-toggle-btn" onclick="event.stopPropagation(); window.toggleGanttRow('${order.id.replace(/'/g, "\\'")}', this)"><i class="fa-solid fa-chevron-down"></i></button>
                        <div class="gantt-stt" style="min-width: 24px; text-align: center; font-weight: bold; color: var(--gray-500); font-size: 0.9rem; margin-right: 0.5rem; border-right: 1px solid var(--gray-200); padding-right: 0.5rem;">
                            ${index + 1}
                        </div>
                        <div class="order-brief" style="width: 100%; min-width: 0;">
                            <span class="ob-id" title="Bấm để copy mã lệnh" style="cursor: pointer;" onclick="window.copyOrderId(this, event, '${order.id.replace(/'/g, "\\'")}')">${order.id} <i class="fa-regular fa-copy" style="margin-left: 2px; opacity: 0.7;"></i></span>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span class="ob-title" title="${order.customerName}" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 0.5rem;">${order.customerName}</span>
                                <div class="ob-dates" style="font-size: 0.7rem; color: var(--gray-500); white-space: nowrap;">
                                    <span><i class="fa-solid fa-calendar-day"></i> ${formatShortDate(order.startDate)} - ${formatShortDate(order.endDate)}</span>
                                    ${order.progress === 100 && order.actualFinishDate ? `<span style="margin-left: 0.25rem; color: ${orderFlagColor}; font-weight: 600;" title="Thực tế hoàn thành"><i class="fa-solid fa-flag-checkered"></i> ${formatShortDate(order.actualFinishDate)}</span>` : ''}
                                </div>
                            </div>
                            <div class="ob-meta" style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; font-size: 0.75rem; margin-top: 2px;">
                                <span><i class="fa-solid fa-cubes"></i> ${order.totalQty} bộ</span>
                                <span style="color: ${orderProgColor}; font-weight: 600;"><i class="fa-solid fa-bars-progress"></i> Lệnh: ${displayProgress}%</span>
                                <span style="color: var(--warning); font-weight: 600;"><i class="fa-solid fa-clock"></i> T.Gian: ${elapsedPercent}%</span>
                            </div>
                        </div>
                        <div class="ob-actions">
                            <button class="ob-btn edit" onclick="event.stopPropagation(); window.editOrder('${order.id.replace(/'/g, "\\'")}')" title="Sửa toàn bộ lệnh"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="ob-btn delete" onclick="event.stopPropagation(); window.deleteOrder('${order.id.replace(/'/g, "\\'")}')" title="Xóa lệnh"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="gantt-sub-items" id="sidebar-sub-${order.id}">
                        ${order.products && order.products.length > 0 ? order.products.map((p, pIndex) => {
                            const taskIdPrefix = order.id.replace(/'/g, "\\'") + '-' + pIndex;
                            let tasksHtml = '';
                            if (p.tasks && p.tasks.length > 0) {
                                tasksHtml = p.tasks.map(t => {
                                    const isDone = parseInt(t['Tiến độ'] || 0) === 100;
                                    
                                    let tFlagColor = 'var(--success)';
                                    let tProgColor = isDone ? 'var(--success)' : 'var(--gray-700)';
                                    if (t['Ngày kết thúc']) {
                                        const endD = new Date(t['Ngày kết thúc']);
                                        endD.setHours(0,0,0,0);
                                        const actualD = (isDone && t['Ngày hoàn thành thực tế']) ? new Date(t['Ngày hoàn thành thực tế']) : new Date();
                                        actualD.setHours(0,0,0,0);
                                        if (actualD > endD) {
                                            tProgColor = 'var(--danger)';
                                            if (isDone) tFlagColor = 'var(--danger)';
                                        }
                                    }

                                    return `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0.5rem; border-bottom: 1px dashed var(--gray-200);">
                                            <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 0.5rem;">
                                                <i class="fa-solid fa-circle-check" style="color: ${isDone ? tFlagColor : 'var(--gray-300)'}; margin-right: 4px;"></i> 
                                                ${t['Tên công việc']}
                                            </span>
                                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                                ${t['Ngày bắt đầu'] && t['Ngày kết thúc'] ? `
                                                <span style="font-size: 0.65rem; color: var(--gray-500); white-space: nowrap;">
                                                    <i class="fa-solid fa-calendar-day"></i> ${formatShortDate(t['Ngày bắt đầu'])} - ${formatShortDate(t['Ngày kết thúc'])}
                                                    ${isDone && t['Ngày hoàn thành thực tế'] ? `<span style="margin-left: 0.25rem; color: ${tFlagColor}; font-weight: 600;" title="Thực tế hoàn thành"><i class="fa-solid fa-flag-checkered"></i> ${formatShortDate(t['Ngày hoàn thành thực tế'])}</span>` : ''}
                                                </span>` : ''}
                                                <span style="font-weight: 600; color: ${tProgColor}; min-width: 30px; text-align: right;">${t['Tiến độ'] || 0}%</span>
                                            </div>
                                        </div>
                                    `;
                                }).join('');
                            } else {
                                tasksHtml = '<div style="padding: 0.35rem 0.5rem; color: var(--gray-400); font-style: italic;">Không có công việc</div>';
                            }
                            
                            let pFlagColor = 'var(--success)';
                            let pProgColor = p.prog === 100 ? 'var(--success)' : 'var(--primary)';
                            if (p.endDate) {
                                const endD = new Date(p.endDate);
                                endD.setHours(0,0,0,0);
                                const actualD = (p.prog === 100 && p.actualFinishDate) ? new Date(p.actualFinishDate) : new Date();
                                actualD.setHours(0,0,0,0);
                                if (actualD > endD) {
                                    pProgColor = 'var(--danger)';
                                    if (p.prog === 100) pFlagColor = 'var(--danger)';
                                }
                            }

                            return `
                                <div class="gantt-sub-item-row" title="${p.name}" style="cursor: pointer; border-bottom: 1px solid var(--gray-100); padding-top: 0.3rem; padding-bottom: 0.3rem; height: auto;" onclick="window.toggleGanttTaskRow('${taskIdPrefix}', this.querySelector('.gantt-task-toggle-btn'), '${order.id.replace(/'/g, "\\'")}')">
                                    <button class="gantt-toggle-btn gantt-task-toggle-btn" style="background: none; border: none; color: var(--gray-500); cursor: pointer; margin-right: 0.25rem; outline: none; padding: 0;" onclick="event.stopPropagation(); window.toggleGanttTaskRow('${taskIdPrefix}', this, '${order.id.replace(/'/g, "\\'")}')"><i class="fa-solid fa-chevron-right"></i></button>
                                    <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 0.5rem;">${p.name}</span>
                                            ${p.startDate && p.endDate ? `
                                            <div style="font-size: 0.65rem; color: var(--gray-500); white-space: nowrap;">
                                                <i class="fa-solid fa-calendar-day"></i> ${formatShortDate(p.startDate)} - ${formatShortDate(p.endDate)}
                                                ${p.prog === 100 && p.actualFinishDate ? `<span style="margin-left: 0.25rem; color: ${pFlagColor}; font-weight: 600;" title="Thực tế hoàn thành"><i class="fa-solid fa-flag-checkered"></i> ${formatShortDate(p.actualFinishDate)}</span>` : ''}
                                            </div>` : ''}
                                        </div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.7rem; margin-top: 2px;">
                                            <span style="color: var(--primary); display: flex; align-items: center; gap: 0.4rem;">
                                                <span>SL: ${p.qty}</span>
                                                ${p.drawings ? p.drawings.split('\n').filter(l => l.trim()).map((l, i) => `<a href="${l.trim()}" target="_blank" onclick="event.stopPropagation();" title="Tải/Xem tài liệu" style="color: var(--info); font-size: 0.75rem;"><i class="fa-solid fa-file-arrow-down"></i></a>`).join('') : ''}
                                            </span>
                                            <span style="font-weight: 600; color: ${pProgColor};">${p.prog}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="gantt-task-items" id="sidebar-task-${taskIdPrefix}" style="display: none; padding-left: 2rem; background-color: var(--gray-50); font-size: 0.8rem;">
                                    ${tasksHtml}
                                </div>
                            `;
                        }).join('') : '<div class="gantt-sub-item-row"><span>Không có sản phẩm</span></div>'}
                    </div>
                </div>
            `;

            let progColorClass = 'progress-blue';

            // Render Timeline Row
            timelineHtml += `
                <div class="gantt-timeline-group">
                    <div class="gantt-timeline-row" style="width: ${totalDays * CELL_WIDTH}px; overflow: hidden;">
                        ${(diffDaysLeft + diffDaysWidth) > 0 ? `
                            <div style="position: absolute; left: ${leftPx}px; width: ${widthPx}px; height: 100%; top: 0;" title="${order.customerName} (${order.startDate} - ${order.endDate})">
                                <!-- Time Bar -->
                                <div class="gantt-bar-container" style="position: absolute; top: 12px; height: 20px; width: 100%; left: 0;">
                                    <div class="gantt-bar-progress ${timeColorClass}" style="width: ${elapsedPercent}%; background-size: ${widthPx}px 100%;">
                                        <span class="gantt-bar-text" style="font-size: 0.65rem;">⏳ ${elapsedPercent > 0 ? Math.round(elapsedPercent) + '%' : ''}</span>
                                    </div>
                                </div>
                                <!-- Progress Bar -->
                                <div class="gantt-bar-container" style="position: absolute; top: 38px; height: 20px; width: 100%; left: 0;">
                                    <div class="gantt-bar-progress ${progColorClass}" style="width: ${totalWeightedProgress}%; background-size: ${widthPx}px 100%;">
                                        <span class="gantt-bar-text" style="font-size: 0.65rem;">🎯 ${totalWeightedProgress > 0 ? totalWeightedProgress + '%' : ''}</span>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="gantt-timeline-sub-items" id="timeline-sub-${order.id}" style="display: none; background-color: rgba(0,0,0,0.02);">
                        ${order.products && order.products.length > 0 ? order.products.map((p, pIndex) => {
                            let pColorClass = 'progress-blue';
                            
                            return `
                            <div class="gantt-timeline-sub-item-row" style="width: ${totalDays * CELL_WIDTH}px; overflow: hidden;">
                                ${(diffDaysLeft + diffDaysWidth) > 0 ? `
                                    <div class="gantt-sub-bar-container" style="left: ${leftPx}px; width: ${widthPx}px; pointer-events: none;">
                                        <div class="gantt-bar-progress ${pColorClass}" style="width: ${p.prog}%; background-size: ${widthPx}px 100%;">
                                        </div>
                                        <div style="position: absolute; right: -40px; font-size: 0.75rem; color: var(--gray-600); font-weight: 600;">${p.prog}%</div>
                                    </div>
                                ` : ''}
                            </div>
                            `;
                        }).join('') : '<div class="gantt-timeline-sub-item-row"></div>'}
                    </div>
                </div>
            `;
        });

        ganttSidebarBody.innerHTML = sidebarHtml;
        // Giữ lại today-line, append các row vào
        ganttTimelineBody.innerHTML += timelineHtml;
    }

    window.isCustomGanttRange = false;
    window.customGanttEndDate = null;

    function updateGanttDateRangeText(date) {
        const dateRangeEl = document.getElementById('ganttDateRange');
        if (dateRangeEl) {
            if (window.isCustomGanttRange && window.customGanttEndDate) {
                dateRangeEl.innerText = `Từ ${date.toLocaleDateString('vi-VN')} đến ${window.customGanttEndDate.toLocaleDateString('vi-VN')}`;
            } else {
                const month = date.getMonth() + 1;
                const year = date.getFullYear();
                dateRangeEl.innerText = `Tháng ${month}, ${year}`;
            }
        }
    }

    // Gantt Navigation Buttons
    const ganttPrev = document.getElementById('ganttPrev');
    const ganttNext = document.getElementById('ganttNext');
    const ganttToday = document.getElementById('ganttToday');
    const ganttApplyRange = document.getElementById('ganttApplyRange');
    const ganttStartDateInput = document.getElementById('ganttStartDate');
    const ganttEndDateInput = document.getElementById('ganttEndDate');
    const ganttStatusFilter = document.getElementById('ganttStatusFilter');

    if (ganttStatusFilter) {
        ganttStatusFilter.addEventListener('change', () => {
            reRenderGantt();
        });
    }

    function reRenderGantt() {
        if (!window.parsedOrders) return;
        initGanttGrid(window.ganttBaseDate, window.GANTT_TOTAL_DAYS);
        renderGanttOrders(window.parsedOrders, window.ganttBaseDate, window.GANTT_TOTAL_DAYS);
        updateGanttDateRangeText(window.ganttBaseDate);
    }
    
    if (ganttApplyRange) {
        ganttApplyRange.addEventListener('click', () => {
            const startVal = ganttStartDateInput.value;
            const endVal = ganttEndDateInput.value;
            if (startVal && endVal) {
                const startDate = new Date(startVal);
                startDate.setHours(0,0,0,0);
                const endDate = new Date(endVal);
                endDate.setHours(0,0,0,0);
                if (startDate <= endDate) {
                    window.isCustomGanttRange = true;
                    window.customGanttEndDate = endDate;
                    window.ganttBaseDate = startDate;
                    const diffTime = endDate.getTime() - startDate.getTime();
                    window.GANTT_TOTAL_DAYS = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
                    
                    if (window.GANTT_TOTAL_DAYS > 365) {
                        alert('Khoảng thời gian quá dài, hiển thị tối đa 365 ngày.');
                        window.GANTT_TOTAL_DAYS = 365;
                        window.customGanttEndDate = new Date(startDate);
                        window.customGanttEndDate.setDate(window.customGanttEndDate.getDate() + 364);
                    }
                    
                    reRenderGantt();
                } else {
                    alert('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.');
                }
            } else {
                alert('Vui lòng chọn đầy đủ Từ ngày và Đến ngày.');
            }
        });
    }

    if (ganttPrev) ganttPrev.addEventListener('click', () => {
        if (!window.ganttBaseDate) return;
        window.isCustomGanttRange = false;
        window.customGanttEndDate = null;
        window.ganttBaseDate.setMonth(window.ganttBaseDate.getMonth() - 1);
        window.GANTT_TOTAL_DAYS = new Date(window.ganttBaseDate.getFullYear(), window.ganttBaseDate.getMonth() + 1, 0).getDate();
        reRenderGantt();
    });

    if (ganttNext) ganttNext.addEventListener('click', () => {
        if (!window.ganttBaseDate) return;
        window.isCustomGanttRange = false;
        window.customGanttEndDate = null;
        window.ganttBaseDate.setMonth(window.ganttBaseDate.getMonth() + 1);
        window.GANTT_TOTAL_DAYS = new Date(window.ganttBaseDate.getFullYear(), window.ganttBaseDate.getMonth() + 1, 0).getDate();
        reRenderGantt();
    });

    if (ganttToday) ganttToday.addEventListener('click', () => {
        const now = new Date();
        window.isCustomGanttRange = false;
        window.customGanttEndDate = null;
        window.ganttBaseDate = new Date(now.getFullYear(), now.getMonth(), 1);
        window.GANTT_TOTAL_DAYS = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        reRenderGantt();
    });

    // ==========================================
    // ORDER MODAL & LOGIC
    // ==========================================
    const createOrderBtn = document.getElementById('createOrderBtn');
    const orderModal = document.getElementById('orderModal');
    const closeOrderModal = document.getElementById('closeOrderModal');
    const cancelOrderModal = document.getElementById('cancelOrderModal');
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    const addProductBtn = document.getElementById('addProductBtn');
    const productListContainer = document.getElementById('productListContainer');

    window.copyOrderId = function(element, event, text) {
        event.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
            const oldHtml = element.innerHTML;
            element.innerHTML = '<i class="fa-solid fa-check"></i> Đã copy';
            setTimeout(() => {
                element.innerHTML = oldHtml;
            }, 1500);
        }).catch(err => {
            console.error('Không thể copy: ', err);
            alert('Lỗi khi copy mã lệnh.');
        });
    };

    window.updateTaskColor = function(taskRow) {
        const planEndInput = taskRow.querySelector('.task-end');
        const actualEndInput = taskRow.querySelector('.task-actual-end');
        if (!planEndInput || !actualEndInput) return;

        const planDate = planEndInput.value ? new Date(planEndInput.value) : null;
        const actualDate = actualEndInput.value ? new Date(actualEndInput.value) : null;
        const labelSpan = actualEndInput.previousElementSibling;

        if (planDate && actualDate) {
            planDate.setHours(0,0,0,0);
            actualDate.setHours(0,0,0,0);
            if (actualDate <= planDate) {
                actualEndInput.style.color = 'var(--success)';
                actualEndInput.style.fontWeight = 'bold';
                if (labelSpan && labelSpan.tagName === 'SPAN') labelSpan.style.color = 'var(--success)';
            } else {
                actualEndInput.style.color = 'var(--danger)';
                actualEndInput.style.fontWeight = 'bold';
                if (labelSpan && labelSpan.tagName === 'SPAN') labelSpan.style.color = 'var(--danger)';
            }
        } else {
            actualEndInput.style.color = '';
            actualEndInput.style.fontWeight = '';
            if (labelSpan && labelSpan.tagName === 'SPAN') labelSpan.style.color = 'var(--gray-600)';
        }
    };

    window.initTaskActualEnd = function(taskRow) {
        const progInput = taskRow.querySelector('.task-prog');
        const actualEndInput = taskRow.querySelector('.task-actual-end');
        if (!progInput || !actualEndInput) return;

        const prog = parseInt(progInput.value) || 0;
        if (prog < 100) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            actualEndInput.value = `${yyyy}-${mm}-${dd}`;
        }
        window.updateTaskColor(taskRow);
    };

    // Auto-update color on change
    document.getElementById('orderForm').addEventListener('change', function(e) {
        if (e.target.classList.contains('task-end') || e.target.classList.contains('task-actual-end') || e.target.classList.contains('task-prog')) {
            const taskRow = e.target.closest('.task-row');
            if (taskRow) window.updateTaskColor(taskRow);
        }
    });

    if (addProductBtn && productListContainer) {
        addProductBtn.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'product-row';
            row.innerHTML = `
                <div class="product-header">
                    <input type="text" class="form-control product-model" placeholder="Tên model/Sản phẩm" list="modelSuggestions" required>
                    <input type="number" class="form-control product-qty" placeholder="SL" min="1" required style="width: 80px;">
                    <input type="number" class="form-control product-prog" placeholder="% Xong" min="0" max="100" style="width: 80px;" title="Tiến độ Model">
                    <button type="button" class="btn btn-outline btn-sm remove-product-btn" title="Xóa Model"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="drawing-links-container" style="padding: 0.5rem 0; border-bottom: 1px dashed var(--gray-200); margin-bottom: 0.5rem;">
                    <div class="drawing-links-wrapper">
                        <div class="drawing-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <input type="url" class="form-control drawing-link" placeholder="Link tài liệu" style="flex: 1; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
                            <button type="button" class="btn btn-outline btn-sm remove-drawing-btn" title="Xóa link"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm add-drawing-btn" style="margin-top: 4px; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i> Thêm link tài liệu</button>
                </div>
                <div class="task-list-container">
                    <div class="task-row">
                        <div class="task-row-top">
                            <input type="text" class="form-control task-name" placeholder="Tên công việc" list="taskNameSuggestions" required>
                            <input type="date" class="form-control task-start" required title="Bắt đầu">
                            <input type="date" class="form-control task-end" required title="Dự kiến xong">
                        </div>
                        <div class="task-row-bottom">
                            <input type="text" class="form-control task-assignee" placeholder="Phụ trách" list="assigneeSuggestions">
                            <input type="text" class="form-control task-note" placeholder="Ghi chú">
                            <input type="number" class="form-control task-prog" placeholder="% Xong" min="0" max="100" style="width: 80px;">
                        </div>
                        <div class="task-row-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.75rem; color: var(--gray-600);"><i class="fa-solid fa-flag-checkered"></i> Xong:</span>
                                <input type="date" class="form-control task-actual-end" title="Thực tế xong" style="width: auto; padding: 0.2rem 0.4rem; font-size: 0.75rem; height: 26px; border: 1px solid var(--gray-300); border-radius: 4px;">
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button type="button" class="complete-task-btn" style="background: var(--success-light); color: var(--success); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Hoàn thành (100%)">
                                    <i class="fa-solid fa-check-circle"></i> Hoàn thành
                                </button>
                                <button type="button" class="remove-task-btn" disabled style="background: var(--danger-light); color: var(--danger); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Xóa công việc">
                                    <i class="fa-solid fa-trash-can"></i> Xóa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn-outline btn-sm add-task-btn" style="margin-top: 8px; font-size: 0.8rem;"><i class="fa-solid fa-plus"></i> Thêm công việc</button>
            `;
            productListContainer.appendChild(row);
            
            const removeBtns = productListContainer.querySelectorAll('.remove-product-btn');
            if (removeBtns.length > 1) {
                removeBtns.forEach(btn => btn.disabled = false);
            }
        });

        productListContainer.addEventListener('click', (e) => {
            // Xóa Model
            const removeProdBtn = e.target.closest('.remove-product-btn');
            if (removeProdBtn && !removeProdBtn.disabled) {
                removeProdBtn.closest('.product-row').remove();
                const btns = productListContainer.querySelectorAll('.remove-product-btn');
                if (btns.length === 1) btns[0].disabled = true;
            }
            
            // Thêm Task
            if (e.target.closest('.add-task-btn')) {
                const taskList = e.target.closest('.product-row').querySelector('.task-list-container');
                const div = document.createElement('div');
                div.className = 'task-row';
                div.innerHTML = `
                    <div class="task-row-top">
                        <input type="text" class="form-control task-name" placeholder="Tên công việc" list="taskNameSuggestions" required>
                        <input type="date" class="form-control task-start" required title="Bắt đầu">
                        <input type="date" class="form-control task-end" required title="Dự kiến xong">
                    </div>
                    <div class="task-row-bottom">
                        <input type="text" class="form-control task-assignee" placeholder="Phụ trách" list="assigneeSuggestions">
                        <input type="text" class="form-control task-note" placeholder="Ghi chú">
                        <input type="number" class="form-control task-prog" placeholder="% Xong" min="0" max="100" style="width: 80px;">
                    </div>
                    <div class="task-row-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.25rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-size: 0.75rem; color: var(--gray-600);"><i class="fa-solid fa-flag-checkered"></i> Xong:</span>
                            <input type="date" class="form-control task-actual-end" title="Thực tế xong" style="width: auto; padding: 0.2rem 0.4rem; font-size: 0.75rem; height: 26px; border: 1px solid var(--gray-300); border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="button" class="complete-task-btn" style="background: var(--success-light); color: var(--success); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Hoàn thành (100%)">
                                <i class="fa-solid fa-check-circle"></i> Hoàn thành
                            </button>
                            <button type="button" class="remove-task-btn" style="background: var(--danger-light); color: var(--danger); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Xóa công việc">
                                <i class="fa-solid fa-trash-can"></i> Xóa
                            </button>
                        </div>
                    </div>
                `;
                taskList.appendChild(div);
                window.initTaskActualEnd(div);
                
                const removeBtns = taskList.querySelectorAll('.remove-task-btn');
                if (removeBtns.length > 1) {
                    removeBtns.forEach(btn => btn.disabled = false);
                }
            }

            // Thêm Drawing Link
            if (e.target.closest('.add-drawing-btn')) {
                const container = e.target.closest('.drawing-links-container').querySelector('.drawing-links-wrapper');
                const div = document.createElement('div');
                div.className = 'drawing-row';
                div.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.25rem;';
                div.innerHTML = `
                    <input type="url" class="form-control drawing-link" placeholder="Link tài liệu" style="flex: 1; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
                    <button type="button" class="btn btn-outline btn-sm remove-drawing-btn" title="Xóa link"><i class="fa-solid fa-trash"></i></button>
                `;
                container.appendChild(div);
            }

            // Xóa Drawing Link
            if (e.target.closest('.remove-drawing-btn')) {
                e.target.closest('.drawing-row').remove();
            }
            
            // Xóa Task
            const removeTaskBtn = e.target.closest('.remove-task-btn');
            if (removeTaskBtn && !removeTaskBtn.disabled) {
                const taskList = removeTaskBtn.closest('.task-list-container');
                removeTaskBtn.closest('.task-row').remove();
                const btns = taskList.querySelectorAll('.remove-task-btn');
                if (btns.length === 1) btns[0].disabled = true;
            }

            // Hoàn thành Task (100%)
            const completeTaskBtn = e.target.closest('.complete-task-btn');
            if (completeTaskBtn) {
                const taskRow = completeTaskBtn.closest('.task-row');
                if (taskRow) {
                    const progInput = taskRow.querySelector('.task-prog');
                    if (progInput) {
                        progInput.value = 100;
                        if (window.updateTaskColor) window.updateTaskColor(taskRow);
                    }
                }
            }
        });
    }

    if (createOrderBtn && orderModal) {
        createOrderBtn.addEventListener('click', () => {
            document.getElementById('orderForm').reset();
            if (productListContainer) {
                productListContainer.innerHTML = `
                    <div class="product-row">
                        <div class="product-header">
                            <input type="text" class="form-control product-model" placeholder="Tên model/Sản phẩm" list="modelSuggestions" required>
                            <input type="number" class="form-control product-qty" placeholder="SL" min="1" required style="width: 80px;">
                            <input type="number" class="form-control product-prog" placeholder="% Xong" min="0" max="100" style="width: 80px;" title="Tiến độ Model">
                            <button type="button" class="btn btn-outline btn-sm remove-product-btn" disabled title="Xóa Model"><i class="fa-solid fa-trash"></i></button>
                        </div>
                        <div class="drawing-links-container" style="padding: 0.5rem 0; border-bottom: 1px dashed var(--gray-200); margin-bottom: 0.5rem;">
                            <div class="drawing-links-wrapper">
                                <div class="drawing-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                                    <input type="url" class="form-control drawing-link" placeholder="Link tài liệu" style="flex: 1; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
                                    <button type="button" class="btn btn-outline btn-sm remove-drawing-btn" title="Xóa link"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                            <button type="button" class="btn btn-outline btn-sm add-drawing-btn" style="margin-top: 4px; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i> Thêm link tài liệu</button>
                        </div>
                        <div class="task-list-container">
                            <div class="task-row">
                                <div class="task-row-top">
                                    <input type="text" class="form-control task-name" placeholder="Tên công việc" list="taskNameSuggestions" required>
                                    <input type="date" class="form-control task-start" required title="Bắt đầu">
                                    <input type="date" class="form-control task-end" required title="Dự kiến xong">
                                </div>
                                <div class="task-row-bottom">
                                    <input type="text" class="form-control task-assignee" placeholder="Phụ trách" list="assigneeSuggestions">
                                    <input type="text" class="form-control task-note" placeholder="Ghi chú">
                                    <input type="number" class="form-control task-prog" placeholder="% Xong" min="0" max="100" style="width: 80px;">
                                </div>
                                <div class="task-row-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.25rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 0.75rem; color: var(--gray-600);"><i class="fa-solid fa-flag-checkered"></i> Xong:</span>
                                        <input type="date" class="form-control task-actual-end" title="Thực tế xong" style="width: auto; padding: 0.2rem 0.4rem; font-size: 0.75rem; height: 26px; border: 1px solid var(--gray-300); border-radius: 4px;">
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button type="button" class="complete-task-btn" style="background: var(--success-light); color: var(--success); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Hoàn thành (100%)">
                                            <i class="fa-solid fa-check-circle"></i> Hoàn thành
                                        </button>
                                        <button type="button" class="remove-task-btn" disabled style="background: var(--danger-light); color: var(--danger); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Xóa công việc">
                                            <i class="fa-solid fa-trash-can"></i> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-outline btn-sm add-task-btn" style="margin-top: 8px; font-size: 0.8rem;"><i class="fa-solid fa-plus"></i> Thêm công việc</button>
                    </div>
                `;
                const taskRows = productListContainer.querySelectorAll('.task-row');
                taskRows.forEach(tr => window.initTaskActualEnd(tr));
            }
            document.getElementById('orderEditMode').value = 'false';
            document.getElementById('orderId').disabled = false;
            document.getElementById('orderId').value = '';
            document.getElementById('saveOrderBtn').innerText = 'Lưu Lệnh SX';
            document.querySelector('.modal-header h3').innerText = 'Tạo Đơn Hàng (Lệnh Sản Xuất)';
            orderModal.classList.add('active');
        });
    }

    function closeModal() {
        if(orderModal) {
            orderModal.classList.remove('active');
            document.getElementById('orderForm').reset();
        }
    }

    if (closeOrderModal) closeOrderModal.addEventListener('click', closeModal);
    if (cancelOrderModal) cancelOrderModal.addEventListener('click', closeModal);

    // Click outside to close (Disabled based on user request)
    // window.addEventListener('click', (e) => {
    //     if (e.target === orderModal) {
    //         closeModal();
    //     }
    // });

    // Save Order Logic
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const form = document.getElementById('orderForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const isEdit = document.getElementById('orderEditMode').value === 'true';
            
            let orderIdVal = document.getElementById('orderId').value.trim();
            if (!orderIdVal.endsWith('-LSX/KD')) {
                orderIdVal += '-LSX/KD';
            }

            let allTasks = [];
            const rows = document.querySelectorAll('#productListContainer .product-row');
            rows.forEach(row => {
                const model = row.querySelector('.product-model').value.trim();
                const qty = row.querySelector('.product-qty').value.trim();
                const modelProg = row.querySelector('.product-prog') ? row.querySelector('.product-prog').value.trim() : '';
                
                // Thu thập link bản vẽ
                const linkInputs = row.querySelectorAll('.drawing-link');
                const links = [];
                linkInputs.forEach(input => {
                    if(input.value.trim()) links.push(input.value.trim());
                });
                const drawingLinksStr = links.join('\n');

                const taskRows = row.querySelectorAll('.task-row');
                taskRows.forEach(tRow => {
                    const taskName = tRow.querySelector('.task-name').value.trim();
                    if (taskName) {
                        allTasks.push({
                            'Model': model,
                            'Số lượng': qty,
                            'Tiến độ Model': modelProg,
                            'Bản vẽ': drawingLinksStr,
                            'Tên công việc': taskName,
                            'Ngày bắt đầu': tRow.querySelector('.task-start').value,
                            'Ngày kết thúc': tRow.querySelector('.task-end').value,
                            'Ngày hoàn thành thực tế': tRow.querySelector('.task-actual-end') ? tRow.querySelector('.task-actual-end').value : '',
                            'Phụ trách': tRow.querySelector('.task-assignee') ? tRow.querySelector('.task-assignee').value.trim() : '',
                            'Ghi chú': tRow.querySelector('.task-note') ? tRow.querySelector('.task-note').value.trim() : '',
                            'Tiến độ': tRow.querySelector('.task-prog') ? tRow.querySelector('.task-prog').value.trim() || 0 : 0
                        });
                    }
                });
            });
            
            // Check if 100% completed
            let isAllTasks100 = true;
            if (allTasks.length === 0) isAllTasks100 = false;
            allTasks.forEach(t => {
                if (parseInt(t['Tiến độ'] || 0) < 100) {
                    isAllTasks100 = false;
                }
            });

            if (isAllTasks100) {
                document.getElementById('orderStatus').value = 'Hoàn thành';
                document.getElementById('orderProgress').value = 100;
                const todayStr = new Date().toISOString().split('T')[0];
                const currentFinishDate = document.getElementById('orderActualFinishDate').value;
                if (!currentFinishDate) {
                    document.getElementById('orderActualFinishDate').value = todayStr;
                }
            } else {
                if (document.getElementById('orderStatus').value !== 'Hoàn thành') {
                    document.getElementById('orderActualFinishDate').value = '';
                }
            }

            // Giữ lại một trường string gộp danh sách Model để lưu vào sheet Production cũ (tùy chọn)
            const modelNames = Array.from(new Set(allTasks.map(t => t['Model']))).join(', ');
            document.getElementById('orderModel').value = modelNames;

            const orderData = {
                'Số lệnh sản xuất': orderIdVal,
                'Khách hàng': document.getElementById('orderCustomer').value,
                'Model': document.getElementById('orderModel').value,
                'Người phụ trách': document.getElementById('orderAssignee').value,
                'Ngày bắt đầu': document.getElementById('orderStartDate').value,
                'Ngày kết thúc': document.getElementById('orderEndDate').value,
                'Ngày hoàn thành thực tế': document.getElementById('orderActualFinishDate').value,
                'Trạng thái': document.getElementById('orderStatus').value,
                'Tiến độ': document.getElementById('orderProgress').value,
                'tasks': allTasks
            };

            const originalText = saveOrderBtn.innerText;
            saveOrderBtn.innerText = 'Đang lưu...';
            saveOrderBtn.disabled = true;

            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                    body: JSON.stringify({
                        action: isEdit ? 'editOrder' : 'addOrder',
                        payload: orderData
                    })
                });
                
                // no-cors will not return JSON properly, we can assume success if no catch
                alert('Đã gửi yêu cầu tạo lệnh sản xuất thành công!');
                closeModal();
                
                // Đợi 2 giây để Google Sheets kịp ghi dữ liệu trước khi tải lại
                setTimeout(() => {
                    loadProductionData(); 
                }, 2000);
            } catch (error) {
                console.error("Error saving order:", error);
                alert('Đã xảy ra lỗi khi lưu đơn hàng.');
            } finally {
                saveOrderBtn.innerText = originalText;
                saveOrderBtn.disabled = false;
            }
        });
    }

    // Load Production Data
    async function loadProductionData() {
        try {
            const result = await fetchFromGoogle('getOrders');
            if (result.status === 'success' && result.data && result.data.length > 0) {
                window.productionOrdersList = result.data;
                const orders = result.data.map(row => {
                    let progressVal = parseFloat(row['Tiến độ'] || row['progress'] || 0);
                    let statusClass = 'progress-blue';
                    if (progressVal >= 60 && progressVal < 85) {
                        statusClass = 'progress-yellow';
                    } else if (progressVal >= 85) {
                        statusClass = 'progress-red';
                    }
                    if (row['Trạng thái'] === 'Hoàn thành') {
                        statusClass = 'status-done';
                    }
                    
                    const pName = row['Model'] ? `${row['Khách hàng']} - ${row['Model']}` : row['Khách hàng'];

                    // Hàm hỗ trợ format date chuẩn YYYY-MM-DD
                    const parseDateStr = (dateVal) => {
                        if (!dateVal) return new Date().toISOString().split('T')[0];
                        const d = new Date(dateVal);
                        if (isNaN(d.getTime())) return dateVal;
                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    };

                    let totalQty = 0;
                    let products = [];
                    
                    if (row.tasks && row.tasks.length > 0) {
                        const mMap = {};
                        row.tasks.forEach(t => {
                            const m = t['Model'] || '';
                            if (!mMap[m]) {
                                const q = parseInt(t['Số lượng']) || 0;
                                totalQty += q;
                                mMap[m] = { name: m, qty: q, prog: parseInt(t['Tiến độ Model']) || 0, tasks: [], drawings: t['Bản vẽ'] || '' };
                            }
                            mMap[m].tasks.push(t);
                        });
                        
                        // Tính toán tiến độ Model dựa trên trung bình cộng tiến độ các Task
                        products = Object.values(mMap).map(m => {
                            let minDate = null;
                            let maxDate = null;
                            if (m.tasks.length > 0) {
                                let taskSum = 0;
                                let validTasks = 0;
                                m.tasks.forEach(task => {
                                    const tProg = parseInt(task['Tiến độ']);
                                    if (!isNaN(tProg)) {
                                        taskSum += tProg;
                                        validTasks++;
                                    }
                                    if (task['Ngày bắt đầu']) {
                                        const ts = new Date(task['Ngày bắt đầu']);
                                        if (!isNaN(ts.getTime())) {
                                            if (!minDate || ts < minDate) minDate = ts;
                                        }
                                    }
                                    if (task['Ngày kết thúc']) {
                                        const te = new Date(task['Ngày kết thúc']);
                                        if (!isNaN(te.getTime())) {
                                            if (!maxDate || te > maxDate) maxDate = te;
                                        }
                                    }
                                });
                                if (validTasks > 0) {
                                    m.prog = Math.round(taskSum / validTasks);
                                }
                                if (minDate) m.startDate = parseDateStr(minDate);
                                if (maxDate) m.endDate = parseDateStr(maxDate);

                                let maxModelActual = null;
                                m.tasks.forEach(task => {
                                    if (parseInt(task['Tiến độ']) === 100 && task['Ngày hoàn thành thực tế']) {
                                        const d = new Date(task['Ngày hoàn thành thực tế']);
                                        if (!isNaN(d.getTime())) {
                                            if (!maxModelActual || d > maxModelActual) maxModelActual = d;
                                        }
                                    }
                                });
                                if (m.prog === 100 && maxModelActual) m.actualFinishDate = parseDateStr(maxModelActual);
                            }
                            return m;
                        });
                    } else {
                        const rawModel = row['Model'] || '';
                        if (rawModel) {
                            const parts = rawModel.split(', ');
                            parts.forEach(part => {
                                const match = part.match(/(.+?)(?:\s*\(SL:\s*(\d+)\))?(?:\s*\[(\d+)%\])?$/);
                                if (match) {
                                    const q = parseInt(match[2]) || 0;
                                    const prog = parseInt(match[3]) || 0;
                                    totalQty += q;
                                    products.push({ name: match[1].trim(), qty: q, prog: prog, drawings: '' });
                                }
                            });
                        }
                    }

                    let maxOrderEndDate = null;
                    if (products && products.length > 0) {
                        products.forEach(p => {
                            if (p.endDate) {
                                const d = new Date(p.endDate);
                                if (!isNaN(d.getTime())) {
                                    if (!maxOrderEndDate || d > maxOrderEndDate) maxOrderEndDate = d;
                                }
                            }
                        });
                    }
                    
                    let finalActualFinishDate = row['Ngày hoàn thành thực tế'] || '';
                    if (progressVal === 100 && maxOrderEndDate) {
                        finalActualFinishDate = parseDateStr(maxOrderEndDate);
                    }

                    return {
                        id: row['Số lệnh sản xuất'] || row['ID'] || 'N/A',
                        customerName: row['Khách hàng'] || 'Không có tên',
                        name: pName || 'Không có tên',
                        assignee: row['Người phụ trách'] || row['assignee'] || '',
                        startDate: parseDateStr(row['Ngày bắt đầu'] || row['startDate']),
                        endDate: parseDateStr(row['Ngày kết thúc'] || row['endDate']),
                        actualFinishDate: finalActualFinishDate,
                        status: row['Trạng thái'] || 'Mới',
                        statusClass: statusClass,
                        progress: progressVal,
                        totalQty: totalQty,
                        products: products
                    };
                });

                window.parsedOrders = orders;

                // Tự động thu thập dữ liệu gợi ý cho datalist
                const customersSet = new Set();
                const modelsSet = new Set();
                const assigneesSet = new Set();
                const tasksSet = new Set();
                
                orders.forEach(o => {
                    if (o.customerName && o.customerName !== 'Không có tên') customersSet.add(o.customerName);
                    if (o.assignee) assigneesSet.add(o.assignee);
                    
                    if (o.products && o.products.length > 0) {
                        o.products.forEach(p => {
                            if (p.name) modelsSet.add(p.name);
                            if (p.tasks && p.tasks.length > 0) {
                                p.tasks.forEach(t => {
                                    if (t['Tên công việc']) tasksSet.add(t['Tên công việc'].trim());
                                    if (t['Phụ trách']) assigneesSet.add(t['Phụ trách'].trim());
                                });
                            }
                        });
                    }
                });

                const populateDatalist = (id, set, defaults = []) => {
                    const el = document.getElementById(id);
                    if (el) {
                        const merged = new Set([...defaults, ...set]);
                        el.innerHTML = Array.from(merged).filter(Boolean).map(val => `<option value="${val}">`).join('');
                    }
                };

                populateDatalist('customerSuggestions', customersSet);
                populateDatalist('modelSuggestions', modelsSet);
                populateDatalist('assigneeSuggestions', assigneesSet);
                populateDatalist('taskNameSuggestions', tasksSet, [
                    "Thiết kế", "Bóc tách", "Cắt CNC", "Dán nẹp", "Khoan cam", "Lắp ráp", "Sơn", "Đóng gói", "Giao hàng", "Lắp đặt"
                ]);


                if (!window.ganttBaseDate) {
                    const now = new Date();
                    window.ganttBaseDate = new Date(now.getFullYear(), now.getMonth(), 1);
                }
                window.GANTT_TOTAL_DAYS = new Date(window.ganttBaseDate.getFullYear(), window.ganttBaseDate.getMonth() + 1, 0).getDate();

                initGanttGrid(window.ganttBaseDate, window.GANTT_TOTAL_DAYS);
                renderGanttOrders(orders, window.ganttBaseDate, window.GANTT_TOTAL_DAYS);
                updateGanttDateRangeText(window.ganttBaseDate);
            } else {
                initGanttGrid();
                renderGanttOrders([]);
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu đơn hàng", error);
            // Fallback empty gantt
            initGanttGrid();
            renderGanttOrders([]);
        }
    }

    // Initialize Gantt Grid when Production section is active
    // We can just call it directly for now or when the tab is clicked.
    
    // Tự động load dữ liệu khi ứng dụng khởi chạy lần đầu
    // loadCRMData();
    loadProductionData();
    
    // Global functions for Edit and Delete
    window.editOrder = function(orderId) {
        if (!window.productionOrdersList) return;
        const rawOrder = window.productionOrdersList.find(o => o['Số lệnh sản xuất'] === orderId || o['ID'] === orderId);
        if (!rawOrder) return;
        
        document.getElementById('orderEditMode').value = 'true';
        
        let displayId = rawOrder['Số lệnh sản xuất'] || '';
        if (displayId.endsWith('-LSX/KD')) {
            displayId = displayId.replace('-LSX/KD', '');
        }
        document.getElementById('orderId').value = displayId;
        document.getElementById('orderId').disabled = true; // Không cho sửa ID
        
        document.getElementById('orderCustomer').value = rawOrder['Khách hàng'] || '';
        
        const rawModel = rawOrder['Model'] || '';
        document.getElementById('orderModel').value = rawModel;
        
        const productContainer = document.getElementById('productListContainer');
        if (productContainer) {
            productContainer.innerHTML = '';
            
            // Hàm tiện ích parse string cho đơn cũ
            function parseOldModelString(rawStr) {
                let parsed = [];
                if (rawStr) {
                    const parts = rawStr.split(', ');
                    parts.forEach(part => {
                        const match = part.match(/(.+?)(?:\s*\(SL:\s*(\d+)\))?(?:\s*\[(\d+)%\])?$/);
                        if (match) {
                            parsed.push({
                                model: match[1].trim(),
                                qty: match[2] ? match[2] : '',
                                prog: match[3] ? match[3] : ''
                            });
                        }
                    });
                }
                return parsed;
            }

            let modelsMap = {}; // key: model name, value: { model, qty, prog, drawings, tasks: [] }
            
            if (rawOrder.tasks && rawOrder.tasks.length > 0) {
                // Đơn hàng mới có tasks
                rawOrder.tasks.forEach(t => {
                    const mName = t['Model'] || '';
                    if (!modelsMap[mName]) {
                        modelsMap[mName] = {
                            model: mName,
                            qty: t['Số lượng'] || '',
                            prog: t['Tiến độ Model'] || '',
                            drawings: t['Bản vẽ'] || '',
                            tasks: []
                        };
                    }
                    if (t['Tên công việc']) {
                        modelsMap[mName].tasks.push(t);
                    }
                });
            } else {
                // Đơn hàng cũ chưa có tasks, parse từ chuỗi
                const oldParsed = parseOldModelString(rawModel);
                oldParsed.forEach(p => {
                    modelsMap[p.model] = {
                        model: p.model,
                        qty: p.qty,
                        prog: p.prog,
                        drawings: '',
                        tasks: [] // Trống
                    };
                });
            }
            
            const modelsArray = Object.values(modelsMap);
            if (modelsArray.length === 0) {
                modelsArray.push({ model: '', qty: '', prog: '', tasks: [] });
            }
            
            // Hàm hỗ trợ format date
            const formatD = (d) => {
                if(!d) return '';
                const dt = new Date(d);
                if(isNaN(dt.getTime())) return d;
                return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            };
            
            modelsArray.forEach((m) => {
                const row = document.createElement('div');
                row.className = 'product-row';
                const isOnlyModel = modelsArray.length === 1;
                
                let tasksHtml = '';
                if (m.tasks.length === 0) {
                     tasksHtml = `
                        <div class="task-row">
                            <div class="task-row-top">
                                <input type="text" class="form-control task-name" placeholder="Tên công việc" list="taskNameSuggestions" required>
                                <input type="date" class="form-control task-start" required title="Bắt đầu">
                                <input type="date" class="form-control task-end" required title="Dự kiến xong">
                            </div>
                            <div class="task-row-bottom">
                                <input type="text" class="form-control task-assignee" placeholder="Phụ trách" list="assigneeSuggestions">
                                <input type="text" class="form-control task-note" placeholder="Ghi chú">
                                <input type="number" class="form-control task-prog" placeholder="% Xong" min="0" max="100" style="width: 80px;">
                            </div>
                            <div class="task-row-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.25rem;">
                                <div style="display: flex; align-items: center; gap: 0.5rem;">
                                    <span style="font-size: 0.75rem; color: var(--gray-600);"><i class="fa-solid fa-flag-checkered"></i> Xong:</span>
                                    <input type="date" class="form-control task-actual-end" title="Thực tế xong" style="width: auto; padding: 0.2rem 0.4rem; font-size: 0.75rem; height: 26px; border: 1px solid var(--gray-300); border-radius: 4px;">
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button type="button" class="complete-task-btn" style="background: var(--success-light); color: var(--success); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Hoàn thành (100%)">
                                        <i class="fa-solid fa-check-circle"></i> Hoàn thành
                                    </button>
                                    <button type="button" class="remove-task-btn" disabled style="background: var(--danger-light); color: var(--danger); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Xóa công việc">
                                        <i class="fa-solid fa-trash-can"></i> Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                     `;
                } else {
                     m.tasks.forEach((t) => {
                         const isOnlyTask = m.tasks.length === 1;
                         tasksHtml += `
                            <div class="task-row">
                                <div class="task-row-top">
                                    <input type="text" class="form-control task-name" placeholder="Tên công việc" value="${t['Tên công việc'] || ''}" list="taskNameSuggestions" required>
                                    <input type="date" class="form-control task-start" value="${formatD(t['Ngày bắt đầu'])}" required title="Bắt đầu">
                                    <input type="date" class="form-control task-end" value="${formatD(t['Ngày kết thúc'])}" required title="Dự kiến xong">
                                </div>
                                <div class="task-row-bottom">
                                    <input type="text" class="form-control task-assignee" placeholder="Phụ trách" value="${t['Phụ trách'] || ''}" list="assigneeSuggestions">
                                    <input type="text" class="form-control task-note" placeholder="Ghi chú" value="${t['Ghi chú'] || ''}">
                                    <input type="number" class="form-control task-prog" placeholder="% Xong" min="0" max="100" value="${t['Tiến độ'] || ''}" style="width: 80px;">
                                </div>
                                <div class="task-row-actions" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--gray-200); padding-top: 0.5rem; margin-top: 0.25rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span style="font-size: 0.75rem; color: var(--gray-600);"><i class="fa-solid fa-flag-checkered"></i> Xong:</span>
                                        <input type="date" class="form-control task-actual-end" value="${t['Ngày hoàn thành thực tế'] ? formatD(t['Ngày hoàn thành thực tế']) : ''}" title="Thực tế xong" style="width: auto; padding: 0.2rem 0.4rem; font-size: 0.75rem; height: 26px; border: 1px solid var(--gray-300); border-radius: 4px;">
                                    </div>
                                    <div style="display: flex; gap: 0.5rem;">
                                        <button type="button" class="complete-task-btn" style="background: var(--success-light); color: var(--success); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Hoàn thành (100%)">
                                            <i class="fa-solid fa-check-circle"></i> Hoàn thành
                                        </button>
                                        <button type="button" class="remove-task-btn" ${isOnlyTask ? 'disabled' : ''} style="background: var(--danger-light); color: var(--danger); border: none; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Xóa công việc">
                                            <i class="fa-solid fa-trash-can"></i> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                         `;
                     });
                }
                
                let drawingsHtml = '';
                if (m.drawings) {
                    const links = m.drawings.split('\\n').filter(l => l.trim() !== '');
                    links.forEach((link, idx) => {
                        drawingsHtml += `
                            <div class="drawing-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <input type="url" class="form-control drawing-link" placeholder="Link tài liệu" value="${link}" style="flex: 1; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
                                <button type="button" class="btn btn-outline btn-sm remove-drawing-btn" title="Xóa link"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `;
                    });
                }
                if (!drawingsHtml) {
                    drawingsHtml = `
                        <div class="drawing-row" style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <input type="url" class="form-control drawing-link" placeholder="Link tài liệu" style="flex: 1; font-size: 0.8rem; padding: 0.4rem 0.6rem;">
                            <button type="button" class="btn btn-outline btn-sm remove-drawing-btn" title="Xóa link"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `;
                }

                row.innerHTML = `
                    <div class="product-header">
                        <input type="text" class="form-control product-model" placeholder="Tên model/Sản phẩm" value="${m.model}" list="modelSuggestions" required>
                        <input type="number" class="form-control product-qty" placeholder="SL" min="1" value="${m.qty}" required style="width: 80px;">
                        <input type="number" class="form-control product-prog" placeholder="% Xong" min="0" max="100" value="${m.prog}" style="width: 80px;" title="Tiến độ Model">
                        <button type="button" class="btn btn-outline btn-sm remove-product-btn" ${isOnlyModel ? 'disabled' : ''} title="Xóa Model"><i class="fa-solid fa-trash"></i></button>
                    </div>
                    <div class="drawing-links-container" style="padding: 0.5rem 0; border-bottom: 1px dashed var(--gray-200); margin-bottom: 0.5rem;">
                        <div class="drawing-links-wrapper">
                            ${drawingsHtml}
                        </div>
                        <button type="button" class="btn btn-outline btn-sm add-drawing-btn" style="margin-top: 4px; font-size: 0.75rem;"><i class="fa-solid fa-plus"></i> Thêm link tài liệu</button>
                    </div>
                    <div class="task-list-container">
                        ${tasksHtml}
                    </div>
                    <button type="button" class="btn btn-outline btn-sm add-task-btn" style="margin-top: 8px; font-size: 0.8rem;"><i class="fa-solid fa-plus"></i> Thêm công việc</button>
                `;
                productContainer.appendChild(row);
            });
        }

        document.getElementById('orderAssignee').value = rawOrder['Người phụ trách'] || '';
        
        // Xử lý ngày tháng tránh bị lệch múi giờ (lùi 1 ngày) do UTC
        function formatDate(dateVal) {
            if (!dateVal) return '';
            const d = new Date(dateVal);
            if (isNaN(d.getTime())) return dateVal; // Trả về nguyên gốc nếu không parse được
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        document.getElementById('orderStartDate').value = formatDate(rawOrder['Ngày bắt đầu']);
        document.getElementById('orderEndDate').value = formatDate(rawOrder['Ngày kết thúc']);
        
        document.getElementById('orderStatus').value = rawOrder['Trạng thái'] || 'Chờ duyệt';
        document.getElementById('orderProgress').value = rawOrder['Tiến độ'] || '0';
        document.getElementById('orderActualFinishDate').value = rawOrder['Ngày hoàn thành thực tế'] ? formatDate(rawOrder['Ngày hoàn thành thực tế']) : '';
        
        document.getElementById('saveOrderBtn').innerText = 'Cập nhật Lệnh SX';
        document.querySelector('.modal-header h3').innerText = 'Chỉnh Sửa Đơn Hàng';
        
        const orderModal = document.getElementById('orderModal');
        if (orderModal) orderModal.classList.add('active');
        
        const taskRows = document.getElementById('productListContainer').querySelectorAll('.task-row');
        taskRows.forEach(tr => window.initTaskActualEnd(tr));
    };

    window.deleteOrder = async function(orderId) {
        if (!confirm(`Bạn có chắc chắn muốn XÓA Lệnh Sản Xuất "${orderId}" không? Hành động này không thể hoàn tác.`)) {
            return;
        }
        
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'deleteOrder',
                    payload: { 'Số lệnh sản xuất': orderId }
                })
            });
            alert('Đã gửi yêu cầu xóa lệnh sản xuất!');
            setTimeout(() => loadProductionData(), 2000);
        } catch (error) {
            console.error("Error deleting order:", error);
            alert('Đã xảy ra lỗi khi xóa đơn hàng.');
        }
    };

    window.toggleGanttRow = function(orderId, btn) {
        if(btn) btn.classList.toggle('expanded');
        const sidebarSub = document.getElementById('sidebar-sub-' + orderId);
        const timelineSub = document.getElementById('timeline-sub-' + orderId);
        
        if (sidebarSub && timelineSub) {
            sidebarSub.classList.toggle('active');
            if (sidebarSub.classList.contains('active')) {
                timelineSub.style.display = 'block';
                timelineSub.style.height = sidebarSub.offsetHeight + 'px';
                timelineSub.style.borderBottom = '1px solid var(--gray-200)';
            } else {
                timelineSub.style.display = 'none';
            }
        }
    };

    window.toggleGanttTaskRow = function(taskId, btn, orderId) {
        if(btn) {
            btn.classList.toggle('expanded');
            const icon = btn.querySelector('i');
            if(icon) {
                if(btn.classList.contains('expanded')) {
                    icon.classList.remove('fa-chevron-right');
                    icon.classList.add('fa-chevron-down');
                } else {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-right');
                }
            }
        }
        
        const taskSub = document.getElementById('sidebar-task-' + taskId);
        if (taskSub) {
            taskSub.style.display = taskSub.style.display === 'none' ? 'block' : 'none';
            
            // Adjust timeline sub height
            const sidebarSub = document.getElementById('sidebar-sub-' + orderId);
            const timelineSub = document.getElementById('timeline-sub-' + orderId);
            if (sidebarSub && timelineSub && sidebarSub.classList.contains('active')) {
                timelineSub.style.height = sidebarSub.offsetHeight + 'px';
            }
        }
    };

    window.updateSubItemProgress = async function(orderId, modelIndex, currentProg) {
        event.stopPropagation();
        
        const newProgStr = prompt(`Cập nhật phần trăm tiến độ (hiện tại: ${currentProg}%):`, currentProg);
        if (newProgStr === null) return;
        
        let newProg = parseInt(newProgStr);
        if (isNaN(newProg) || newProg < 0 || newProg > 100) {
            alert('Vui lòng nhập một số hợp lệ từ 0 đến 100.');
            return;
        }
        
        if (!window.productionOrdersList) return;
        const rawOrder = window.productionOrdersList.find(o => o['Số lệnh sản xuất'] === orderId || o['ID'] === orderId);
        if (!rawOrder) return;
        
        let models = [];
        const rawModel = rawOrder['Model'] || '';
        const parts = rawModel.split(', ');
        
        parts.forEach((part) => {
            if (!part.trim()) return;
            const match = part.match(/(.+?)(?:\s*\(SL:\s*(\d+)\))?(?:\s*\[(\d+)%\])?$/);
            if (match) {
                models.push({
                    name: match[1].trim(),
                    qty: match[2] ? match[2] : '',
                    prog: match[3] ? parseInt(match[3]) : 0
                });
            }
        });

        if (models[modelIndex]) {
            models[modelIndex].prog = newProg;
        }

        // Tạo lại chuỗi Model
        const newModelString = models.map(m => {
            let s = m.qty ? `${m.name} (SL: ${m.qty})` : m.name;
            if (m.prog > 0) s += ` [${m.prog}%]`;
            return s;
        }).join(', ');

        const formData = {
            'Số lệnh sản xuất': rawOrder['Số lệnh sản xuất'] || rawOrder['ID'],
            'Khách hàng': rawOrder['Khách hàng'] || '',
            'Model': newModelString,
            'Người phụ trách': rawOrder['Người phụ trách'] || '',
            'Ngày bắt đầu': rawOrder['Ngày bắt đầu'] || '',
            'Ngày kết thúc': rawOrder['Ngày kết thúc'] || '',
            'Trạng thái': rawOrder['Trạng thái'] || '',
            'Tiến độ': rawOrder['Tiến độ'] || ''
        };

        // Show loading state implicitly or explicit UI block
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    action: 'editOrder',
                    payload: formData
                })
            });
            setTimeout(() => {
                loadProductionData();
            }, 1000);
        } catch (e) {
            console.error(e);
            alert('Lỗi cập nhật tiến độ!');
        }
    };

    } catch (error) {
        console.error(error);
        alert("Lỗi hệ thống: " + error.message + "\n" + error.stack);
    }
});
