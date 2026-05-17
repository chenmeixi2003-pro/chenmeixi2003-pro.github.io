document.addEventListener('DOMContentLoaded', () => {
    // --- 侧边栏导航逻辑 ---
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有active
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active-section'));

            // 添加当前active
            this.classList.add('active');
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active-section');
            
            // 移动端点击后自动滚动到顶部
            if(window.innerWidth <= 900) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });

    // --- 手风琴交互逻辑 ---
    const accordionItems = document.querySelectorAll('.accordion-item');

    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');

        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // 如果想要互斥（点开一个关闭其他），取消下面的注释
            accordionItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-content').style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add('active');
                // 因为图片或链接加载可能会影响高度，给一个足够大的 max-height 
                // 或者在内容有变化时重新计算
                content.style.maxHeight = content.scrollHeight + 200 + "px"; 
            }
        });
    });

    // --- 教育地图交互逻辑 (Leaflet) ---
    const cityBtns = document.querySelectorAll('.city-btn');
    
    // 城市坐标 [纬度, 经度]
    const cities = {
        hulunbuir: [49.2153, 119.7361], // 呼伦贝尔海拉尔
        chengdu: [30.6586, 104.0649],   // 成都
        hongkong: [22.3193, 114.1694],  // 香港
        shenzhen: [22.5431, 114.0579]   // 深圳
    };

    // 初始化地图，设置中心点为中国并设置缩放级别
    const map = L.map('real-map', {
        zoomControl: true,
        scrollWheelZoom: false // 防止页面滚动时误触缩放
    }).setView([35.8617, 104.1954], 4);

    // 添加 OpenStreetMap 图层
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 自定义 Marker 图标 (可选，这里使用默认的或简单的圆形标记)
    const markers = {};
    for (const [city, coords] of Object.entries(cities)) {
        markers[city] = L.marker(coords).addTo(map);
        
        // 点击地图上的 marker 也可以激活对应城市
        markers[city].on('click', () => {
            activateCity(city);
        });
    }

    // 绘制连线
    const latlngs = [
        cities.hulunbuir,
        cities.chengdu,
        cities.hongkong,
        cities.shenzhen
    ];
    
    // 使用带虚线样式的线连接城市
    const polyline = L.polyline(latlngs, {
        color: '#6c5ce7', 
        weight: 3, 
        dashArray: '10, 10',
        opacity: 0.8
    }).addTo(map);

    // 调整地图视野以包含所有点
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // 激活城市的函数
    function activateCity(city) {
        // 更新按钮状态
        cityBtns.forEach(btn => {
            if (btn.getAttribute('data-city') === city) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // 让地图平滑飞到对应城市，设置较高的缩放级别
        map.flyTo(cities[city], 6, {
            animate: true,
            duration: 1.5
        });
    }

    // 绑定按钮点击事件
    cityBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const city = this.getAttribute('data-city');
            activateCity(city);
        });
    });

    // 初始化默认选中呼伦贝尔
    activateCity('hulunbuir');

    // --- 轮播图与弹窗通用逻辑 ---
    function setupCarousel(modalId, openBtnId, closeBtnId, trackId, prevBtnId, nextBtnId, indicatorsId) {
        const modal = document.getElementById(modalId);
        const openBtn = document.getElementById(openBtnId);
        const closeBtn = document.getElementById(closeBtnId);
        
        const track = document.getElementById(trackId);
        if (!track) return; // 如果找不到 track，说明可能这段代码还没在 HTML 里，直接返回防止报错
        
        const slides = Array.from(track.children);
        const nextBtn = document.getElementById(nextBtnId);
        const prevBtn = document.getElementById(prevBtnId);
        const dots = Array.from(document.getElementById(indicatorsId).querySelectorAll('.dot'));
        
        let currentIndex = 0;

        // 打开弹窗
        if (openBtn) {
            openBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止触发手风琴折叠
                modal.classList.add('active');
                updateCarousel(0); // 每次打开重置到第一张
            });
        }

        // 关闭弹窗
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        // 点击弹窗外部遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });

        // 更新轮播图状态
        function updateCarousel(index) {
            currentIndex = index;
            // 移动轨道
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            
            // 更新小圆点状态
            dots.forEach(dot => dot.classList.remove('active'));
            dots[currentIndex].classList.add('active');
        }

        // 下一张
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                let nextIndex = currentIndex + 1;
                if (nextIndex >= slides.length) nextIndex = 0; // 循环
                updateCarousel(nextIndex);
            });
        }

        // 上一张
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                let prevIndex = currentIndex - 1;
                if (prevIndex < 0) prevIndex = slides.length - 1; // 循环
                updateCarousel(prevIndex);
            });
        }

        // 点击小圆点跳转
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                updateCarousel(index);
            });
        });
    }

    // 初始化 Anker 轮播图
    setupCarousel(
        'ankerModal', 'openAnkerModal', 'closeAnkerModal', 
        'ankerTrack', 'ankerPrevBtn', 'ankerNextBtn', 'ankerIndicators'
    );

    // 初始化 ReelShort 轮播图
    setupCarousel(
        'reelshortModal', 'openReelshortModal', 'closeReelshortModal', 
        'reelshortTrack', 'reelshortPrevBtn', 'reelshortNextBtn', 'reelshortIndicators'
    );

    // 窗口大小变化时重新计算展开的手风琴高度
    window.addEventListener('resize', () => {
        const activeItems = document.querySelectorAll('.accordion-item.active');
        activeItems.forEach(item => {
            const content = item.querySelector('.accordion-content');
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });
});
