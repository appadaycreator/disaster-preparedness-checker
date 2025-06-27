// グローバル変数
let currentSection = 'home';
let checkedItems = 0;
let totalItems = 50;
let basicInfo = {};
let checklistData = {};
let resultData = {};

// PWA設定
const manifestContent = {
    "name": "防災準備度チェック「備えの達人」",
    "short_name": "備えの達人",
    "description": "家庭の防災準備状況を地域特性に応じて診断し、改善提案を提供します",
    "start_url": "./",
    "display": "standalone",
    "theme_color": "#dc2626",
    "background_color": "#ffffff",
    "icons": [
        {
            "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>",
            "sizes": "192x192",
            "type": "image/svg+xml"
        }
    ]
};

// マニフェストの動的設定
const manifestBlob = new Blob([JSON.stringify(manifestContent)], {type: 'application/json'});
const manifestURL = URL.createObjectURL(manifestBlob);
document.getElementById('manifest-placeholder').href = manifestURL;

// DOM要素取得
const elements = {
    startBtn: document.getElementById('startBtn'),
    historyBtn: document.getElementById('historyBtn'),
    startCheckBtn: document.getElementById('startCheckBtn'),
    calculateBtn: document.getElementById('calculateBtn'),
    shareBtn: document.getElementById('shareBtn'),
    printBtn: document.getElementById('printBtn'),
    saveBtn: document.getElementById('saveBtn'),
    retryBtn: document.getElementById('retryBtn'),
    basicInfoForm: document.getElementById('basicInfoForm'),
    checklistSection: document.getElementById('checklistSection'),
    resultSection: document.getElementById('resultSection'),
    historySection: document.getElementById('history'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    totalScore: document.getElementById('totalScore'),
    scoreComment: document.getElementById('scoreComment')
};

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadHistory();
});

// アプリ初期化
function initializeApp() {
    // ナビゲーション
    elements.startBtn.addEventListener('click', () => showSection('check'));
    elements.historyBtn.addEventListener('click', () => showSection('history'));
    
    // 基本情報フォーム
    elements.startCheckBtn.addEventListener('click', startChecklist);
    
    // チェックリスト
    elements.calculateBtn.addEventListener('click', calculateResults);
    
    // 結果アクション
    elements.shareBtn.addEventListener('click', () => showModal('shareModal'));
    elements.printBtn.addEventListener('click', printResults);
    elements.saveBtn.addEventListener('click', saveResults);
    elements.retryBtn.addEventListener('click', resetForm);

    // チェックボックス変更イベント
    document.querySelectorAll('.checklist-item').forEach(checkbox => {
        checkbox.addEventListener('change', updateProgress);
    });

    // フォーム入力検証
    ['prefecture', 'housingType', 'familySize'].forEach(id => {
        document.getElementById(id).addEventListener('change', validateBasicForm);
    });

    // フッターリンク
    document.querySelector('a[href="#privacy"]').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('privacyModal');
    });
    document.querySelector('a[href="#terms"]').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('termsModal');
    });
    document.querySelector('a[href="#disclaimer"]').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('disclaimerModal');
    });
    document.querySelector('a[href="#contact"]').addEventListener('click', (e) => {
        e.preventDefault();
        showModal('contactModal');
    });

    // お問い合わせフォーム
    document.getElementById('contactForm').addEventListener('submit', handleContactSubmit);

    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // レスポンシブメニュー
    document.getElementById('menuBtn').addEventListener('click', toggleMobileMenu);
    document.querySelectorAll('#mobileMenu a').forEach(link => {
        link.addEventListener('click', () => toggleMobileMenu());
    });
}

// セクション表示
function showSection(section) {
    // 全セクション非表示
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    
    // 対象セクション表示
    const targetSection = document.getElementById(section);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    currentSection = section;
}

// 基本情報フォーム検証
function validateBasicForm() {
    const prefecture = document.getElementById('prefecture').value;
    const housingType = document.getElementById('housingType').value;
    const familySize = document.getElementById('familySize').value;
    
    const isValid = prefecture && housingType && familySize;
    elements.startCheckBtn.disabled = !isValid;
    
    if (isValid) {
        elements.startCheckBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        elements.startCheckBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// チェックリスト開始
function startChecklist() {
    // 基本情報収集
    basicInfo = {
        prefecture: document.getElementById('prefecture').value,
        housingType: document.getElementById('housingType').value,
        familySize: document.getElementById('familySize').value,
        hasInfants: document.getElementById('hasInfants').checked,
        hasChildren: document.getElementById('hasChildren').checked,
        hasElderly: document.getElementById('hasElderly').checked,
        hasPets: document.getElementById('hasPets').checked,
        timestamp: new Date().toISOString()
    };

    // フォーム非表示、チェックリスト表示
    elements.basicInfoForm.classList.add('hidden');
    elements.checklistSection.classList.remove('hidden');
    elements.checklistSection.classList.add('fade-in');
}

// 進捗更新
function updateProgress() {
    checkedItems = document.querySelectorAll('.checklist-item:checked').length;
    const progress = (checkedItems / totalItems) * 100;
    
    elements.progressBar.style.width = `${progress}%`;
    elements.progressText.textContent = `${checkedItems} / ${totalItems}`;
    
    // 完了時のアニメーション
    if (checkedItems === totalItems) {
        elements.progressBar.classList.add('bg-green-500');
        elements.calculateBtn.classList.add('shake');
        setTimeout(() => {
            elements.calculateBtn.classList.remove('shake');
        }, 500);
    }
}

// 結果計算
function calculateResults() {
    // チェックリストデータ収集
    const categories = {
        'water-food': { items: [], total: 12 },
        'equipment': { items: [], total: 15 },
        'evacuation': { items: [], total: 8 },
        'information': { items: [], total: 7 },
        'family': { items: [], total: 8 }
    };

    document.querySelectorAll('[data-category]').forEach(categoryDiv => {
        const categoryName = categoryDiv.dataset.category;
        const checkboxes = categoryDiv.querySelectorAll('.checklist-item');
        
        checkboxes.forEach((checkbox, index) => {
            categories[categoryName].items.push(checkbox.checked);
        });
    });

    // スコア計算
    const scores = {};
    let totalScore = 0;

    Object.keys(categories).forEach(category => {
        const checkedCount = categories[category].items.filter(item => item).length;
        const categoryScore = Math.round((checkedCount / categories[category].total) * 100);
        scores[category] = categoryScore;
        totalScore += categoryScore;
    });

    totalScore = Math.round(totalScore / Object.keys(categories).length);

    // 結果データ保存
    resultData = {
        basicInfo,
        scores,
        totalScore,
        checkedItems,
        categories,
        timestamp: new Date().toISOString()
    };

    // 結果表示
    displayResults();
}

// 結果表示
function displayResults() {
    // スコア表示
    elements.totalScore.textContent = resultData.totalScore;
    
    // コメント生成
    let comment = '';
    if (resultData.totalScore >= 90) {
        comment = '素晴らしい！非常に高いレベルの防災準備ができています。';
    } else if (resultData.totalScore >= 70) {
        comment = '良好です。いくつかの改善点はありますが、基本的な準備はできています。';
    } else if (resultData.totalScore >= 50) {
        comment = '平均的です。重要な項目から順次改善していきましょう。';
    } else if (resultData.totalScore >= 30) {
        comment = '改善の余地があります。基本的な備蓄から始めましょう。';
    } else {
        comment = '防災準備が不足しています。すぐに基本的な対策を始めることをお勧めします。';
    }
    
    elements.scoreComment.textContent = comment;

    // レーダーチャート表示
    createRadarChart();

    // 改善提案生成
    generateSuggestions();

    // セクション表示
    elements.checklistSection.classList.add('hidden');
    elements.resultSection.classList.remove('hidden');
    elements.resultSection.classList.add('fade-in');
}

// レーダーチャート作成
function createRadarChart() {
    const ctx = document.getElementById('radarChart').getContext('2d');
    
    const data = {
        labels: [
            '水・食料備蓄',
            '防災用品',
            '避難準備',
            '情報収集',
            '家族連携'
        ],
        datasets: [{
            label: '現在のスコア',
            data: [
                resultData.scores['water-food'],
                resultData.scores['equipment'],
                resultData.scores['evacuation'],
                resultData.scores['information'],
                resultData.scores['family']
            ],
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            borderColor: 'rgb(220, 38, 38)',
            borderWidth: 2,
            pointBackgroundColor: 'rgb(220, 38, 38)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6
        }]
    };

    const config = {
        type: 'radar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    };

    new Chart(ctx, config);
}

// 改善提案生成
function generateSuggestions() {
    const suggestionsContainer = document.getElementById('suggestionsContent');
    const suggestions = [];

    // カテゴリ別の提案
    const categoryNames = {
        'water-food': '水・食料備蓄',
        'equipment': '防災用品',
        'evacuation': '避難準備',
        'information': '情報収集',
        'family': '家族連携'
    };

    const categoryAdvice = {
        'water-food': [
            '1人1日3リットル×最低3日分の飲料水を確保しましょう',
            '非常食は家族の人数×3日分以上を備蓄しましょう',
            'ローリングストック法で定期的に食品を入れ替えましょう',
            'カセットコンロとボンベを用意しましょう'
        ],
        'equipment': [
            '懐中電灯と乾電池を複数個用意しましょう',
            'ポータブルラジオで情報収集手段を確保しましょう',
            'モバイルバッテリーで通信手段を維持しましょう',
            '救急箱と常備薬を準備しましょう'
        ],
        'evacuation': [
            '避難場所と避難経路を家族で確認しましょう',
            '非常持出袋を準備し、定期的に見直しましょう',
            '家具の転倒防止対策を実施しましょう',
            '重要書類のコピーを別途保管しましょう'
        ],
        'information': [
            '地域の防災アプリをインストールしましょう',
            'ハザードマップを確認・印刷保管しましょう',
            '災害伝言ダイヤル(171)の使い方を覚えましょう',
            '自治体のSNSをフォローしましょう'
        ],
        'family': [
            '家族会議で災害時の行動を話し合いましょう',
            '家族の連絡先リストを全員が持ちましょう',
            '集合場所と連絡方法を決めておきましょう',
            '年1回以上の防災訓練に参加しましょう'
        ]
    };

    // 低スコアカテゴリの提案
    Object.keys(resultData.scores).forEach(category => {
        if (resultData.scores[category] < 70) {
            suggestions.push({
                category: categoryNames[category],
                score: resultData.scores[category],
                advice: categoryAdvice[category]
            });
        }
    });

    // 地域特性に応じた提案
    const regionAdvice = getRegionSpecificAdvice(basicInfo.prefecture);
    if (regionAdvice.length > 0) {
        suggestions.push({
            category: '地域特性対応',
            advice: regionAdvice
        });
    }

    // 家族構成に応じた提案
    const familyAdvice = getFamilySpecificAdvice(basicInfo);
    if (familyAdvice.length > 0) {
        suggestions.push({
            category: '家族構成対応',
            advice: familyAdvice
        });
    }

    // HTML生成
    let html = '';
    suggestions.forEach(suggestion => {
        html += `
            <div class="mb-6 p-4 border-l-4 border-red-500 bg-red-50">
                <h5 class="font-bold text-gray-800 mb-3">
                    ${suggestion.category}
                    ${suggestion.score ? `(現在${suggestion.score}点)` : ''}
                </h5>
                <ul class="space-y-2">
                    ${suggestion.advice.map(item => `
                        <li class="flex items-start">
                            <i class="fas fa-arrow-right text-red-500 mr-2 mt-1"></i>
                            <span class="text-gray-700">${item}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    });

    // アフィリエイトリンク追加
    html += generateAffiliateSection();

    suggestionsContainer.innerHTML = html;
}

// 地域特性アドバイス
function getRegionSpecificAdvice(prefecture) {
    const advice = [];
    
    // 地震リスクの高い地域
    if (['東京都', '神奈川県', '千葉県', '埼玉県', '静岡県', '愛知県', '大阪府', '兵庫県'].includes(prefecture)) {
        advice.push('首都直下地震・南海トラフ地震に備えて、建物の耐震化を検討しましょう');
        advice.push('密集市街地では火災対策も重要です');
    }
    
    // 津波リスク地域
    if (['岩手県', '宮城県', '福島県', '茨城県', '千葉県', '神奈川県', '静岡県', '愛知県', '三重県', '和歌山県', '徳島県', '高知県'].includes(prefecture)) {
        advice.push('津波ハザードマップを確認し、高台への避難経路を複数確保しましょう');
    }
    
    // 豪雪地域
    if (['青森県', '岩手県', '秋田県', '山形県', '福島県', '新潟県', '富山県', '石川県', '福井県', '長野県'].includes(prefecture)) {
        advice.push('豪雪による孤立に備えて、冬期間の備蓄を強化しましょう');
        advice.push('停電時の暖房手段を確保しましょう');
    }
    
    // 台風・豪雨地域
    if (['沖縄県', '鹿児島県', '宮崎県', '熊本県', '大分県', '福岡県', '佐賀県', '長崎県'].includes(prefecture)) {
        advice.push('台風シーズン前に防風対策と排水設備の点検をしましょう');
        advice.push('停電長期化に備えて発電機の導入を検討しましょう');
    }
    
    return advice;
}

// 家族構成アドバイス
function getFamilySpecificAdvice(info) {
    const advice = [];
    
    if (info.hasInfants) {
        advice.push('粉ミルク・離乳食・オムツを多めに備蓄しましょう');
        advice.push('赤ちゃん用の避難用品（抱っこ紐、毛布等）を準備しましょう');
    }
    
    if (info.hasChildren) {
        advice.push('学校との連絡方法・お迎えルールを確認しましょう');
        advice.push('子ども用のヘルメットと笛を用意しましょう');
    }
    
    if (info.hasElderly) {
        advice.push('常備薬を多めに備蓄し、お薬手帳をコピーしましょう');
        advice.push('車椅子・歩行器の点検と避難方法を検討しましょう');
    }
    
    if (info.hasPets) {
        advice.push('ペット用の避難用品（キャリー、フード、水）を準備しましょう');
        advice.push('ペット同行避難可能な避難所を事前確認しましょう');
    }
    
    if (info.familySize === '1') {
        advice.push('一人暮らしでは安否確認手段の確保が重要です');
        advice.push('近隣住民との連携を検討しましょう');
    }
    
    return advice;
}

// アフィリエイトセクション生成
function generateAffiliateSection() {
    return `
        <div class="mt-8 p-6 bg-blue-50 rounded-xl">
            <h5 class="font-bold text-blue-800 mb-4 flex items-center">
                <i class="fas fa-shopping-cart mr-2"></i>
                おすすめ防災用品
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold mb-2">防災セット</h6>
                    <p class="text-sm text-gray-600 mb-3">必要な防災用品がまとめて揃います</p>
                    <a href="#" class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>
                        商品を見る（Amazon）
                    </a>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold mb-2">非常食セット</h6>
                    <p class="text-sm text-gray-600 mb-3">長期保存可能な美味しい非常食</p>
                    <a href="#" class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>
                        商品を見る（楽天）
                    </a>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold mb-2">モバイルバッテリー</h6>
                    <p class="text-sm text-gray-600 mb-3">大容量で太陽光充電も可能</p>
                    <a href="#" class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>
                        商品を見る（A8.net）
                    </a>
                </div>
                <div class="bg-white p-4 rounded-lg shadow">
                    <h6 class="font-bold mb-2">簡易トイレ</h6>
                    <p class="text-sm text-gray-600 mb-3">災害時の衛生管理に必須</p>
                    <a href="#" class="text-blue-600 hover:text-blue-800 text-sm">
                        <i class="fas fa-external-link-alt mr-1"></i>
                        商品を見る（もしもアフィリエイト）
                    </a>
                </div>
            </div>
            <div class="mt-4 text-sm text-gray-500">
                <i class="fas fa-info-circle mr-1"></i>
                これらのリンクはアフィリエイトリンクです。収益はサービス運営費に充てられます。
            </div>
        </div>
    `;
}

// 結果保存
function saveResults() {
    try {
        // 履歴取得
        let history = JSON.parse(localStorage.getItem('disasterPreparednessHistory') || '[]');
        
        // 新しい結果を追加
        history.unshift(resultData);
        
        // 最大20件まで保存
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        
        // 保存
        localStorage.setItem('disasterPreparednessHistory', JSON.stringify(history));
        
        // 通知
        showNotification('診断結果を保存しました！', 'success');
        
        // 履歴更新
        loadHistory();
    } catch (error) {
        showNotification('保存に失敗しました。', 'error');
    }
}

// 履歴読み込み
function loadHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('disasterPreparednessHistory') || '[]');
        const historyContent = document.getElementById('historyContent');
        
        if (history.length === 0) {
            historyContent.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-clipboard-list text-4xl mb-4"></i>
                    <p>まだ診断履歴がありません。<br>最初の診断を完了すると、ここに履歴が表示されます。</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        history.forEach((record, index) => {
            const date = new Date(record.timestamp).toLocaleDateString('ja-JP');
            const scoreColor = record.totalScore >= 70 ? 'text-green-600' : record.totalScore >= 50 ? 'text-yellow-600' : 'text-red-600';
            
            html += `
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="text-3xl font-bold ${scoreColor}">${record.totalScore}</div>
                            <div>
                                <div class="font-bold text-gray-800">診断結果 #${index + 1}</div>
                                <div class="text-gray-500 text-sm">${date}</div>
                            </div>
                        </div>
                        <button onclick="viewHistoryDetail(${index})" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-eye mr-1"></i>詳細
                        </button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-gray-500">水・食料</div>
                            <div class="font-bold">${record.scores['water-food']}点</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500">防災用品</div>
                            <div class="font-bold">${record.scores['equipment']}点</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500">避難準備</div>
                            <div class="font-bold">${record.scores['evacuation']}点</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500">情報収集</div>
                            <div class="font-bold">${record.scores['information']}点</div>
                        </div>
                        <div class="text-center">
                            <div class="text-gray-500">家族連携</div>
                            <div class="font-bold">${record.scores['family']}点</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        historyContent.innerHTML = html;
    } catch (error) {
        console.error('履歴読み込みエラー:', error);
    }
}

// 履歴詳細表示
function viewHistoryDetail(index) {
    const history = JSON.parse(localStorage.getItem('disasterPreparednessHistory') || '[]');
    const record = history[index];
    
    if (record) {
        // 過去の結果をcurrentに設定して結果画面表示
        resultData = record;
        displayResults();
        showSection('check');
    }
}

// フォームリセット
function resetForm() {
    // フォームクリア
    document.getElementById('prefecture').value = '';
    document.getElementById('housingType').value = '';
    document.getElementById('familySize').value = '';
    document.getElementById('hasInfants').checked = false;
    document.getElementById('hasChildren').checked = false;
    document.getElementById('hasElderly').checked = false;
    document.getElementById('hasPets').checked = false;
    
    // チェックボックスクリア
    document.querySelectorAll('.checklist-item').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // 進捗リセット
    checkedItems = 0;
    updateProgress();
    
    // セクション表示リセット
    elements.resultSection.classList.add('hidden');
    elements.checklistSection.classList.add('hidden');
    elements.basicInfoForm.classList.remove('hidden');
    
    // フォーム検証
    validateBasicForm();
    
    showSection('check');
}

// 印刷
function printResults() {
    const printWindow = window.open('', '_blank');
    const printContent = generatePrintContent();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

// 印刷用コンテンツ生成
function generatePrintContent() {
    const date = new Date().toLocaleDateString('ja-JP');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>防災準備度診断結果 - ${date}</title>
            <style>
                body { font-family: 'Yu Gothic', 'Meiryo', sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px; }
                .score { font-size: 48px; color: #dc2626; font-weight: bold; text-align: center; margin: 20px 0; }
                .category { margin: 15px 0; padding: 10px; border: 1px solid #ccc; }
                .category h3 { margin: 0 0 10px 0; color: #dc2626; }
                .suggestions { margin-top: 30px; }
                .suggestions ul { list-style-type: disc; margin-left: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>防災準備度診断結果</h1>
                <p>診断日：${date}</p>
                <p>地域：${resultData.basicInfo.prefecture} | 家族：${resultData.basicInfo.familySize}人</p>
            </div>
            
            <div class="score">${resultData.totalScore}点 / 100点</div>
            
            <div class="categories">
                <div class="category">
                    <h3>水・食料備蓄：${resultData.scores['water-food']}点</h3>
                </div>
                <div class="category">
                    <h3>防災用品：${resultData.scores['equipment']}点</h3>
                </div>
                <div class="category">
                    <h3>避難準備：${resultData.scores['evacuation']}点</h3>
                </div>
                <div class="category">
                    <h3>情報収集：${resultData.scores['information']}点</h3>
                </div>
                <div class="category">
                    <h3>家族連携：${resultData.scores['family']}点</h3>
                </div>
            </div>
            
            <div class="suggestions">
                <h2>改善提案</h2>
                <p>診断結果に基づいて、以下の点を改善することをお勧めします：</p>
                <ul>
                    <li>スコアが70点未満のカテゴリを優先的に改善</li>
                    <li>地域の災害リスクに応じた対策の強化</li>
                    <li>家族構成に応じた特別な準備</li>
                    <li>3ヶ月ごとの定期的な見直し</li>
                </ul>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666;">
                <p>防災準備度チェック「備えの達人」</p>
                <p>https://appadaycreator.github.io/disaster-preparedness-checker/</p>
            </div>
        </body>
        </html>
    `;
}

// SNSシェア
function shareToTwitter() {
    const text = `30日連続開発チャレンジ（120/30）

https://appadaycreator.github.io/disaster-preparedness-checker/

🛡️あなたの防災準備は何点？
無料の防災準備度チェックを作りました！
✅ 地域特性も考慮した診断
✅ 50項目の包括チェック
✅ 個別改善提案も生成

いざという時のために今すぐチェック🚨

#継続は力なり #防災 #備蓄 #地震対策 #無料ツール`;

    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// リンクコピー
function copyLink() {
    const url = 'https://appadaycreator.github.io/disaster-preparedness-checker/';
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            showNotification('リンクをコピーしました！', 'success');
        });
    } else {
        // フォールバック
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('リンクをコピーしました！', 'success');
    }
}

// モーダル表示
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// モーダル非表示
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// お問い合わせ送信
function handleContactSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    // 実際の送信処理（今回はダミー）
    setTimeout(() => {
        showNotification('お問い合わせを受け付けました。ありがとうございます。', 'success');
        closeModal('contactModal');
        document.getElementById('contactForm').reset();
    }, 500);
}

// 通知表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// モバイルメニュー切り替え
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (!menu) return;
    menu.classList.toggle('hidden');
}

// PWA関連
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Service Worker内容（ダミー）
const swContent = `
    const CACHE_NAME = 'disaster-preparedness-v1';
    const urlsToCache = [
        '/',
        '/index.html',
        'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
        'https://cdn.jsdelivr.net/npm/chart.js'
    ];

    self.addEventListener('install', event => {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => cache.addAll(urlsToCache))
        );
    });

    self.addEventListener('fetch', event => {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request);
                })
        );
    });
`;

// モーダル外クリックで閉じる
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        const modals = ['shareModal', 'privacyModal', 'termsModal', 'disclaimerModal', 'contactModal'];
        modals.forEach(modalId => {
            if (e.target.id === modalId) {
                closeModal(modalId);
            }
        });
    }
});

// ESCキーでモーダル閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = ['shareModal', 'privacyModal', 'termsModal', 'disclaimerModal', 'contactModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && !modal.classList.contains('hidden')) {
                closeModal(modalId);
            }
        });
    }
});

// 初期フォーム状態設定
validateBasicForm();
