// Not Uygulaması - Ana JavaScript Dosyası
class NotApp {
    constructor() {
        this.notlar = this.notlariYukle();
        this.kategoriFiltresi = 'hepsi';
        this.init();
    }

    init() {
        this.elemanlariOlustur();
        this.olaylariEkle();
        this.notlariGoster();
    }

    elemanlariOlustur() {
        // Ana container
        const app = document.createElement('div');
        app.className = 'note-app';
        app.innerHTML = `
            <header class="app-header">
                <h1>📝 Not Uygulaması</h1>
                <div class="header-controls">
                    <input type="text" id="arama" placeholder="Not ara...">
                    <select id="kategori-filtre">
                        <option value="hepsi">Tüm Kategoriler</option>
                        <option value="genel">Genel</option>
                        <option value="is">İş</option>
                        <option value="kisisel">Kişisel</option>
                    </select>
                    <button id="yeni-not-btn">Yeni Not</button>
                </div>
            </header>
            <main id="notlar-container">
                <!-- Notlar burada gösterilecek -->
            </main>
        `;
        document.body.appendChild(app);
    }

    olaylariEkle() {
        document.getElementById('yeni-not-btn').addEventListener('click', () => this.yeniNot());
        document.getElementById('arama').addEventListener('input', (e) => this.notlariFiltrele(e.target.value));
        document.getElementById('kategori-filtre').addEventListener('change', (e) => {
            this.kategoriFiltresi = e.target.value;
            this.notlariGoster();
        });
    }

    yeniNot() {
        const baslik = prompt('Not başlığı:');
        const icerik = prompt('Not içeriği:');
        const kategori = prompt('Kategori (genel/is/kisisel):') || 'genel';

        if (baslik && icerik) {
            const yeniNot = {
                id: Date.now(),
                baslik,
                icerik,
                kategori,
                tarih: new Date().toLocaleDateString('tr-TR')
            };

            this.notlar.push(yeniNot);
            this.notlariKaydet();
            this.notlariGoster();
        }
    }

    notSil(id) {
        if (confirm('Bu notu silmek istediğinizden emin misiniz?')) {
            this.notlar = this.notlar.filter(not => not.id !== id);
            this.notlariKaydet();
            this.notlariGoster();
        }
    }

    notlariGoster() {
        const container = document.getElementById('notlar-container');
        let filtrelenmisNotlar = this.notlar;

        if (this.kategoriFiltresi !== 'hepsi') {
            filtrelenmisNotlar = this.notlar.filter(not => not.kategori === this.kategoriFiltresi);
        }

        if (filtrelenmisNotlar.length === 0) {
            container.innerHTML = '<p class="no-notes">Henüz not bulunmuyor.</p>';
            return;
        }

        container.innerHTML = filtrelenmisNotlar.map(not => `
            <div class="note-card" data-kategori="${not.kategori}">
                <div class="note-header">
                    <h3>${not.baslik}</h3>
                    <div class="note-actions">
                        <span class="kategori-badge">${not.kategori}</span>
                        <button onclick="app.notSil(${not.id})" class="sil-btn">🗑️</button>
                    </div>
                </div>
                <p class="note-content">${not.icerik}</p>
                <small class="note-date">${not.tarih}</small>
            </div>
        `).join('');
    }

    notlariFiltrele(aramaMetni) {
        const cards = document.querySelectorAll('.note-card');
        cards.forEach(card => {
            const baslik = card.querySelector('h3').textContent.toLowerCase();
            const icerik = card.querySelector('.note-content').textContent.toLowerCase();
            const arama = aramaMetni.toLowerCase();

            if (baslik.includes(arama) || icerik.includes(arama)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    notlariKaydet() {
        localStorage.setItem('notlar', JSON.stringify(this.notlar));
    }

    notlariYukle() {
        const kayitliNotlar = localStorage.getItem('notlar');
        return kayitliNotlar ? JSON.parse(kayitliNotlar) : [];
    }
}

// Uygulama başlat
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new NotApp();
});