// Not Uygulaması v2.0 - Güvenli ve Gelişmiş JavaScript Dosyası
class NotApp {
    constructor() {
        this.notlar = this.notlariYukle();
        this.kategoriFiltresi = 'hepsi';
        this.currentEditId = null;
        this.autoSaveTimer = null;
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        this.olaylariEkle();
        this.klavyeKisayollariEkle();
        this.notlariGoster();
        this.applyTheme();
        this.startAutoSave();
    }

    // HTML sanitization utility
    sanitizeHTML(input) {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    }

    // Input validation
    validateInput(baslik, icerik, kategori) {
        const errors = [];
        
        if (!baslik || baslik.trim().length === 0) {
            errors.push('Başlık gereklidir.');
        } else if (baslik.length > 100) {
            errors.push('Başlık 100 karakterden fazla olamaz.');
        }
        
        if (!icerik || icerik.trim().length === 0) {
            errors.push('İçerik gereklidir.');
        } else if (icerik.length > 1000) {
            errors.push('İçerik 1000 karakterden fazla olamaz.');
        }
        
        const validKategoriler = ['genel', 'is', 'kisisel'];
        if (!validKategoriler.includes(kategori)) {
            errors.push('Geçersiz kategori.');
        }
        
        return errors;
    }

    // Show notification
    showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }


    olaylariEkle() {
        // Event delegation kullanarak güvenlik sorunu çözülüyor
        document.addEventListener('click', (e) => {
            if (e.target.matches('#yeni-not-btn')) {
                this.modalAc();
            } else if (e.target.matches('#theme-toggle')) {
                this.toggleTheme();
            } else if (e.target.matches('#export-btn')) {
                this.exportNotes();
            } else if (e.target.matches('.sil-btn')) {
                const id = parseInt(e.target.dataset.id);
                this.notSil(id);
            } else if (e.target.matches('.edit-btn')) {
                const id = parseInt(e.target.dataset.id);
                this.notDuzenle(id);
            } else if (e.target.matches('#close-modal') || e.target.matches('#cancel-btn')) {
                this.modalKapat();
            }
        });

        const aramaInput = document.getElementById('arama');
        if (aramaInput) {
            aramaInput.addEventListener('input', (e) => {
                this.notlariFiltrele(e.target.value);
            });
        }

        const kategoriFiltreSelect = document.getElementById('kategori-filtre');
        if (kategoriFiltreSelect) {
            kategoriFiltreSelect.addEventListener('change', (e) => {
                this.kategoriFiltresi = e.target.value;
                this.notlariGoster();
            });
        }

        // Modal form submit
        const noteForm = document.getElementById('note-form');
        if (noteForm) {
            noteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.notKaydet();
            });
        }

        // Modal background click to close
        const noteModal = document.getElementById('note-modal');
        if (noteModal) {
            noteModal.addEventListener('click', (e) => {
                if (e.target.id === 'note-modal') {
                    this.modalKapat();
                }
            });
        }
    }

    klavyeKisayollariEkle() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+N: Yeni not
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.modalAc();
            }
            // Ctrl+F: Arama odağı
            else if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                const aramaInput = document.getElementById('arama');
                if (aramaInput) {
                    aramaInput.focus();
                }
            }
            // Ctrl+S: Form kaydet (sadece modal açıkken)
            else if (e.ctrlKey && e.key === 's') {
                const modal = document.getElementById('note-modal');
                if (!modal.classList.contains('hidden')) {
                    e.preventDefault();
                    this.notKaydet();
                }
            }
            // Escape: Modal kapat
            else if (e.key === 'Escape') {
                this.modalKapat();
            }
            // Ctrl+?: Yardım göster/gizle
            else if (e.ctrlKey && e.key === '?') {
                e.preventDefault();
                this.toggleShortcutsInfo();
            }
        });
    }

    toggleShortcutsInfo() {
        const info = document.getElementById('shortcuts-info');
        info.classList.toggle('show');
    }

    modalAc(editMode = false) {
        const modal = document.getElementById('note-modal');
        const title = document.getElementById('modal-title');
        
        if (editMode) {
            title.textContent = 'Not Düzenle';
        } else {
            title.textContent = 'Yeni Not Ekle';
            this.currentEditId = null;
            document.getElementById('note-form').reset();
        }
        
        modal.classList.remove('hidden');
        document.getElementById('note-title').focus();
    }

    modalKapat() {
        const modal = document.getElementById('note-modal');
        modal.classList.add('hidden');
        this.currentEditId = null;
        document.getElementById('note-form').reset();
    }

    notKaydet() {
        const baslik = document.getElementById('note-title').value.trim();
        const icerik = document.getElementById('note-content').value.trim();
        const kategori = document.getElementById('note-category').value;
        const tags = document.getElementById('note-tags').value.trim();

        // Input validation
        const errors = this.validateInput(baslik, icerik, kategori);
        if (errors.length > 0) {
            this.showNotification(errors.join(' '), 'error');
            return;
        }

        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        if (this.currentEditId) {
            // Düzenleme modu
            const index = this.notlar.findIndex(not => not.id === this.currentEditId);
            if (index !== -1) {
                this.notlar[index] = {
                    ...this.notlar[index],
                    baslik,
                    icerik,
                    kategori,
                    tags: tagsArray,
                    guncellenmeTarihi: new Date().toLocaleDateString('tr-TR')
                };
                this.showNotification('Not başarıyla güncellendi!');
            }
        } else {
            // Yeni not ekleme
            const yeniNot = {
                id: Date.now() + Math.random(), // Collision risk'ini azaltır
                baslik,
                icerik,
                kategori,
                tags: tagsArray,
                tarih: new Date().toLocaleDateString('tr-TR'),
                guncellenmeTarihi: null
            };

            this.notlar.push(yeniNot);
            this.showNotification('Not başarıyla eklendi!');
        }

        this.notlariKaydet();
        this.notlariGoster();
        this.modalKapat();
    }

    notDuzenle(id) {
        const not = this.notlar.find(n => n.id === id);
        if (!not) return;

        this.currentEditId = id;
        
        document.getElementById('note-title').value = not.baslik;
        document.getElementById('note-content').value = not.icerik;
        document.getElementById('note-category').value = not.kategori;
        document.getElementById('note-tags').value = not.tags ? not.tags.join(', ') : '';
        
        this.modalAc(true);
    }

    notSil(id) {
        const not = this.notlar.find(n => n.id === id);
        if (!not) return;

        if (confirm(`"${not.baslik}" başlıklı notu silmek istediğinizden emin misiniz?`)) {
            this.notlar = this.notlar.filter(not => not.id !== id);
            this.notlariKaydet();
            this.notlariGoster();
            this.showNotification('Not başarıyla silindi!');
        }
    }

    notlariGoster() {
        const container = document.getElementById('notlar-container');
        let filtrelenmisNotlar = this.notlar;

        if (this.kategoriFiltresi !== 'hepsi') {
            filtrelenmisNotlar = this.notlar.filter(not => not.kategori === this.kategoriFiltresi);
        }

        if (filtrelenmisNotlar.length === 0) {
            container.innerHTML = '<p class="no-notes">Henüz not bulunmuyor. Yeni not eklemek için "Yeni Not" butonuna tıklayın.</p>';
            return;
        }

        // XSS vulnerability fixed: HTML sanitization kullanılıyor
        container.innerHTML = filtrelenmisNotlar.map(not => `
            <div class="note-card" data-kategori="${this.sanitizeHTML(not.kategori)}">
                <div class="note-header">
                    <h3>${this.sanitizeHTML(not.baslik)}</h3>
                    <div class="note-actions">
                        <span class="kategori-badge">${this.sanitizeHTML(not.kategori)}</span>
                        <button class="edit-btn" data-id="${not.id}" title="Düzenle">✏️</button>
                        <button class="sil-btn" data-id="${not.id}" title="Sil">🗑️</button>
                    </div>
                </div>
                ${not.tags && not.tags.length > 0 ? 
                    `<div class="note-tags">
                        ${not.tags.map(tag => `<span class="tag">${this.sanitizeHTML(tag)}</span>`).join('')}
                    </div>` : ''
                }
                <p class="note-content">${this.sanitizeHTML(not.icerik)}</p>
                <small class="note-date">
                    Oluşturulma: ${not.tarih}
                    ${not.guncellenmeTarihi ? ` | Güncelleme: ${not.guncellenmeTarihi}` : ''}
                </small>
            </div>
        `).join('');
    }

    notlariFiltrele(aramaMetni) {
        const cards = document.querySelectorAll('.note-card');
        const arama = aramaMetni.toLowerCase();

        cards.forEach(card => {
            const baslik = card.querySelector('h3').textContent.toLowerCase();
            const icerik = card.querySelector('.note-content').textContent.toLowerCase();
            const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');

            if (baslik.includes(arama) || icerik.includes(arama) || tags.includes(arama)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Theme switching feature
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('theme', this.theme);
        this.showNotification(`${this.theme === 'dark' ? 'Karanlık' : 'Aydınlık'} tema etkinleştirildi!`);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
    }

    // Export functionality
    exportNotes() {
        if (this.notlar.length === 0) {
            this.showNotification('Dışa aktarılacak not bulunmuyor!', 'warning');
            return;
        }

        const format = prompt('Hangi formatta dışa aktarmak istiyorsunuz? (json/csv):', 'json');
        
        if (!format || !['json', 'csv'].includes(format.toLowerCase())) {
            this.showNotification('Geçersiz format!', 'error');
            return;
        }

        let content, mimeType, filename;

        if (format.toLowerCase() === 'json') {
            content = JSON.stringify(this.notlar, null, 2);
            mimeType = 'application/json';
            filename = `notlar_${new Date().toISOString().split('T')[0]}.json`;
        } else {
            // CSV format
            const headers = ['ID', 'Başlık', 'İçerik', 'Kategori', 'Etiketler', 'Tarih', 'Güncelleme Tarihi'];
            const csvContent = [
                headers.join(','),
                ...this.notlar.map(not => [
                    not.id,
                    `"${not.baslik.replace(/"/g, '""')}"`,
                    `"${not.icerik.replace(/"/g, '""')}"`,
                    not.kategori,
                    `"${(not.tags || []).join('; ')}"`,
                    not.tarih,
                    not.guncellenmeTarihi || ''
                ].join(','))
            ].join('\n');
            
            content = csvContent;
            mimeType = 'text/csv;charset=utf-8;';
            filename = `notlar_${new Date().toISOString().split('T')[0]}.csv`;
        }

        // Download dosyası
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);

        this.showNotification(`Notlar ${format.toUpperCase()} formatında dışa aktarıldı!`);
    }

    // Auto-save functionality
    startAutoSave() {
        this.autoSaveTimer = setInterval(() => {
            this.notlariKaydet();
        }, 30000); // Her 30 saniyede bir otomatik kaydet
    }

    // Error handling için improved localStorage operations
    notlariKaydet() {
        try {
            localStorage.setItem('notlar', JSON.stringify(this.notlar));
        } catch (error) {
            console.error('Notlar kaydedilirken hata oluştu:', error);
            this.showNotification('Notlar kaydedilirken hata oluştu!', 'error');
        }
    }

    notlariYukle() {
        try {
            const kayitliNotlar = localStorage.getItem('notlar');
            return kayitliNotlar ? JSON.parse(kayitliNotlar) : [];
        } catch (error) {
            console.error('Notlar yüklenirken hata oluştu:', error);
            this.showNotification('Notlar yüklenirken hata oluştu!', 'error');
            return [];
        }
    }

    // Cleanup method
    destroy() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
    }
}

// Uygulama başlat - Global variable pollution önlendi
document.addEventListener('DOMContentLoaded', () => {
    window.notApp = new NotApp();
});