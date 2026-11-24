import { useRef, useState } from "react";

const FOCUS_MODES = [
  { id: "all", label: "Tam Analiz", prompt: "Tüm belgeyi özetle, ana maddeleri ve 5 çalışma sorusunu çıkar." },
  { id: "summary", label: "Özet Çıkar", prompt: "Belgenin kapsamlı ve net bir özetini oluştur." },
  { id: "insights", label: "Önemli Maddeler", prompt: "Belgedeki kritik kavramları ve öne çıkan bulguları listele." },
  { id: "questions", label: "5 Çalışma Sorusu", prompt: "Belge içeriğini ölçen 5 adet derinlemesine soru üret." },
];

export default function App() {
  const [file, setFile] = useState(null);
  const [activeNav, setActiveNav] = useState("ask");
  const [focusMode, setFocusMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const currentFocus = FOCUS_MODES.find((m) => m.id === focusMode) || FOCUS_MODES[0];

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] || null;
    setError("");
    if (selected) {
      setFile(selected);
    }
  };

  const handleNewSession = () => {
    setFile(null);
    setResult(null);
    setError("");
    setCustomNote("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!file) {
      setError("Analiz başlatmak için alt bardan bir .txt belgesi seç.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/analyze", {
        method: "POST",
        body: formData,
      });

      const rawText = await response.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error("Sunucudan geçersiz JSON yanıtı döndü.");
      }

      if (!response.ok) {
        throw new Error(data.detail || "Belge analizi sırasında hata oluştu.");
      }

      const enriched = {
        ...data,
        id: Date.now(),
        createdAt: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        focusLabel: currentFocus.label,
        note: customNote.trim() || currentFocus.prompt,
      };

      setResult(enriched);
      setHistory((prev) => [enriched, ...prev]);
      setCustomNote("");
    } catch (err) {
      setError(err.message || "Backend sunucusuna (127.0.0.1:8000) bağlanılamadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!result) return;
    const md = [
      `# ${result.filename}`,
      `\n## Özet\n${result.summary}`,
      `\n## Önemli Maddeler\n${(result.key_points || []).map((p) => `- ${p}`).join("\n")}`,
      `\n## 5 Çalışma Sorusu\n${(result.questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
    ].join("\n");

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const filteredHistory = history.filter((item) =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInsights = history.reduce((acc, item) => acc + (item.key_points?.length || 0), 0);
  const totalQuestions = history.reduce((acc, item) => acc + (item.questions?.length || 0), 0);

  return (
    <div style={styles.shell}>
      {/* SOL SIDEBAR */}
      <aside style={styles.leftSidebar}>
        <div>
          <div style={styles.brandRow}>
            <div style={styles.brandLeft}>
              <div style={styles.logoGrid}>
                <span style={styles.logoDot} />
                <span style={styles.logoDot} />
                <span style={styles.logoDot} />
                <span style={{ ...styles.logoDot, background: "#a3e635" }} />
              </div>
              <span style={styles.brandTitle}>MiniMind AI</span>
            </div>
            <span style={styles.sidebarBadge}>LOCAL</span>
          </div>

          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="text"
              placeholder="Belge ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            <span style={styles.shortcutTag}>⌘K</span>
          </div>

          <div style={styles.navGroup}>
            <button
              type="button"
              onClick={() => setActiveNav("ask")}
              style={{
                ...styles.navItemPrimary,
                background: activeNav === "ask" ? "#232327" : "transparent",
              }}
            >
              <span>✦ Ask AI</span>
              <span style={{ color: "#71717a", fontSize: 11 }}>⌃</span>
            </button>

            <div style={styles.subNavList}>
              <button type="button" onClick={handleNewSession} style={styles.subNavItemActive}>
                <span style={styles.activeBar} />
                <span>+ Yeni analiz</span>
              </button>
              <button
                type="button"
                onClick={() => history[0] && setResult(history[0])}
                style={styles.subNavItem}
              >
                <span>↺ Son oturumlar</span>
              </button>
            </div>
          </div>

          <div style={styles.menuList}>
            <div style={styles.menuRow}>
              <span>📄 Belgeler</span>
              {history.length > 0 && <span style={styles.counterPill}>{history.length}</span>}
            </div>
            <div style={styles.menuRow}>
              <span>≡ Özetler</span>
              {history.length > 0 && <span style={styles.counterPill}>{history.length}</span>}
            </div>
            <div style={styles.menuRow}>
              <span>✦ Çıkarımlar</span>
              {totalInsights > 0 && <span style={styles.counterPill}>{totalInsights}</span>}
            </div>
            <div style={styles.menuRow}>
              <span>? Sorular</span>
              {totalQuestions > 0 && <span style={styles.counterPill}>{totalQuestions}</span>}
            </div>
            <div style={styles.menuRow}>
              <span>⚡ Ollama (Gemma 3:4b)</span>
              <span style={styles.onlineDot} />
            </div>
          </div>
        </div>

        <div>
          <div style={styles.workspaceInfo}>
            <div style={styles.workspaceRow}>
              <span>🌐 Çalışma Alanı</span>
              <span style={{ color: "#a1a1aa", fontSize: 12 }}>Localhost</span>
            </div>
            <div style={styles.workspaceRow}>
              <span>🛡 API Durumu</span>
              <span style={styles.orangeDot} />
            </div>
          </div>

          <div style={styles.bottomCard}>
            <div style={styles.bottomCardTitle}>Yerel Belge Zekası</div>
            <div style={styles.bottomCardDesc}>
              Veriler cihazından çıkmadan FastAPI + Ollama ile işlenir.
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={styles.purpleFullBtn}
            >
              ✦ .TXT Belgesi Yükle
            </button>
          </div>
        </div>
      </aside>

      {/* ORTA ANA ÇALIŞMA ALANI */}
      <main style={styles.centerPanel}>
        <header style={styles.centerHeader}>
          <div>
            <h1 style={styles.greeting}>Merhaba, Mustafa!</h1>
            <p style={styles.subGreeting}>Bugün hangi belgeyi analiz etmek istiyorsun?</p>
          </div>

          <div style={styles.headerActions}>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              disabled={!result}
              title="Markdown olarak kopyala"
              style={{
                ...styles.iconCircleBtn,
                opacity: result ? 1 : 0.45,
                cursor: result ? "pointer" : "not-allowed",
              }}
            >
              {copied ? "✓" : "⧉"}
            </button>
            <button
              type="button"
              onClick={handleNewSession}
              title="Temizle"
              style={styles.iconCircleBtn}
            >
              ↻
            </button>
          </div>
        </header>

        {/* ODAK SEÇİCİ HAPLAR */}
        <div style={styles.focusSection}>
          <div style={styles.sectionLabel}>Odak noktanı seç</div>
          <div style={styles.pillRow}>
            {FOCUS_MODES.map((mode) => {
              const active = focusMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setFocusMode(mode.id)}
                  style={active ? styles.pillActive : styles.pillDefault}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ORTA ÇALIŞMA KARTI */}
        <section style={styles.stageCard}>
          <div style={styles.stageTopBar}>
            <span style={styles.stageTitle}>
              {result
                ? `Analiz Tamamlandı: ${result.filename}`
                : "Belgelerin hakkında özet, madde ve çalışma soruları üret."}
            </span>
            <button
              type="button"
              onClick={handleNewSession}
              style={styles.refreshMiniBtn}
              title="Sıfırla"
            >
              ↻
            </button>
          </div>

          <div style={styles.stageBody}>
            {/* ÜST SATIR: SOL ASİSTAN + SAĞ İSTEK BALONU */}
            <div style={styles.conversationTop}>
              <div style={styles.botCluster}>
                <div style={styles.botOrb}>
                  <div style={styles.botFace}>
                    <span style={styles.botEye} />
                    <span style={styles.botEye} />
                  </div>
                </div>
                <span style={styles.botStatusText}>
                  {loading
                    ? "Gemma 3:4b belgeyi işliyor..."
                    : result
                    ? "Çıktılar yapılandırıldı"
                    : file
                    ? `${file.name} analize hazır`
                    : "Belge bekleniyor..."}
                </span>
              </div>

              <div style={styles.userBubble}>
                {result ? result.note : file ? `${file.name} — ${currentFocus.prompt}` : currentFocus.prompt}
              </div>
            </div>

            {error && <div style={styles.errorBanner}>{error}</div>}

            {/* ÇIKTI / FAZ KARTLARI */}
            {!result && !loading && (
              <div style={styles.goalContainer}>
                <span style={styles.goalBadge}>HEDEF</span>
                <p style={styles.goalText}>
                  Yüklediğin .txt belgesini yerel LLM motoruyla ayrıştırarak yapılandırılmış özet,
                  temel çıkarımlar ve 5 ölçme sorusu oluşturur.
                </p>

                <div style={styles.phaseDivider} />

                <div style={styles.phaseRow}>
                  <div>
                    <div style={styles.phaseTitle}>Aşama 1 — Belge Doğrulama</div>
                    <div style={styles.phaseDesc}>
                      UTF-8 metin ayrıştırma ve minimum karakter eşiği kontrolü.
                    </div>
                  </div>
                  <span style={file ? styles.statusCompleted : styles.statusWaiting}>
                    {file ? "✓ Dosya Seçildi" : "• Bekleniyor"}
                  </span>
                </div>

                <div style={styles.phaseRow}>
                  <div>
                    <div style={styles.phaseTitle}>Aşama 2 — Yapılandırılmış JSON Çıkarımı</div>
                    <div style={styles.phaseDesc}>
                      Özet, önemli maddeler ve 5 çalışma sorusu üretimi.
                    </div>
                  </div>
                  <span style={styles.statusInProgress}>● Hazır</span>
                </div>
              </div>
            )}

            {loading && (
              <div style={styles.goalContainer}>
                <span style={styles.goalBadge}>İŞLENİYOR</span>
                <p style={styles.goalText}>
                  <strong>{file?.name}</strong> dosyası FastAPI üzerinden Ollama (gemma3:4b) modeline
                  gönderildi. Yanıt yapılandırılıyor...
                </p>
              </div>
            )}

            {result && !loading && (
              <div style={styles.resultStack}>
                {(focusMode === "all" || focusMode === "summary") && (
                  <div style={styles.resultBlock}>
                    <div style={styles.resultBlockHeader}>
                      <span style={styles.goalBadge}>ÖZET</span>
                      <span style={styles.statusCompleted}>✓ Tamamlandı</span>
                    </div>
                    <p style={styles.summaryParagraph}>{result.summary}</p>
                  </div>
                )}

                {(focusMode === "all" || focusMode === "insights") && (
                  <div style={styles.resultBlock}>
                    <div style={styles.resultBlockHeader}>
                      <span style={styles.phaseTitle}>Önemli Maddeler</span>
                      <span style={styles.statusInProgress}>
                        ● {(result.key_points || []).length} Bulgu
                      </span>
                    </div>
                    <ul style={styles.bulletList}>
                      {(result.key_points || []).map((point, idx) => (
                        <li key={idx} style={styles.listItem}>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(focusMode === "all" || focusMode === "questions") && (
                  <div style={styles.resultBlock}>
                    <div style={styles.resultBlockHeader}>
                      <span style={styles.phaseTitle}>5 Çalışma Sorusu</span>
                      <span style={styles.statusCompleted}>
                        ✓ {(result.questions || []).length} Soru
                      </span>
                    </div>
                    <ol style={styles.orderedList}>
                      {(result.questions || []).map((q, idx) => (
                        <li key={idx} style={styles.listItem}>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ALT DOSYA SEÇME VE GÖNDERME BARI */}
          <form onSubmit={handleSubmit} style={styles.composerWrap}>
            <div style={styles.composerBar}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={styles.attachBtn}
                title=".txt dosyası seç"
              >
                📎
              </button>

              <span style={styles.sparkIcon}>✦</span>

              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={
                  file
                    ? `Seçili: ${file.name} — İsteğe bağlı not ekle veya Analiz Et'e bas...`
                    : "Önce 📎 simgesinden bir .txt dosyası seç..."
                }
                style={styles.composerInput}
              />

              {file && (
                <span style={styles.fileChip} title={file.name}>
                  {file.name}
                </span>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.sendBtn,
                  opacity: loading ? 0.65 : 1,
                }}
              >
                {loading ? "İşleniyor..." : "Analiz Et"}
              </button>
            </div>
            <div style={styles.composerFootNote}>
              Endpoint: POST http://127.0.0.1:8000/api/analyze • Yalnızca .txt dosyaları desteklenir
            </div>
          </form>
        </section>
      </main>

      {/* SAĞ SIDEBAR: GEÇMİŞ VE DURUM KARTLARI */}
      <aside style={styles.rightSidebar}>
        <div>
          <div style={styles.rightHeader}>
            <span style={styles.rightTitle}>↺ Son analizler</span>
          </div>

          <div style={styles.filterLabel}>Filtreler:</div>
          <div style={styles.filterRow}>
            <div style={styles.selectFake}>
              <span>Belgeler (.txt)</span>
              <span>⌄</span>
            </div>
            <div style={styles.selectFake}>
              <span>{currentFocus.label}</span>
              <span>⌄</span>
            </div>
          </div>

          <div style={styles.historyList}>
            {filteredHistory.length === 0 ? (
              <div style={styles.emptyHistory}>
                Henüz analiz kaydı yok. İlk .txt dosyanı yüklediğinde burada listelenir.
              </div>
            ) : (
              filteredHistory.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setResult(item)}
                  style={{
                    ...styles.historyItem,
                    color: result?.id === item.id ? "#ffffff" : "#a1a1aa",
                  }}
                >
                  {idx + 1}. {item.filename} — {item.focusLabel} ({item.createdAt})
                </button>
              ))
            )}
          </div>
        </div>

        {/* SAĞ ALT 3 DURUM KARTI */}
        <div style={styles.statusCardsStack}>
          <div style={styles.statusCard}>
            <div style={styles.statusCardTop}>
              <span style={styles.badgeBlue}>Mapping</span>
              <span style={styles.dots}>•••</span>
            </div>
            <div style={styles.statusCardTitle}>Belge Bağlam Haritası</div>
            <div style={styles.statusCardDesc}>
              {file
                ? `${file.name} dosyası Pydantic şemasıyla eşleştirildi.`
                : "Yüklenen metin bölümleri yapılandırılmış alanlara bağlanır."}
            </div>
          </div>

          <div style={styles.statusCard}>
            <div style={styles.statusCardTop}>
              <span style={styles.badgeGreen}>Analyzing</span>
              <span style={styles.dots}>•••</span>
            </div>
            <div style={styles.statusCardTitle}>
              {loading ? "Gemma 3:4b aktif çalışıyor" : `${history.length} belge işlendi`}
            </div>
            <div style={styles.statusCardDesc}>
              Ana fikirler, kritik maddeler ve tekrar eden kavramlar çıkarılır.
            </div>
          </div>

          <div style={styles.statusCard}>
            <div style={styles.statusCardTop}>
              <span style={styles.badgeAmber}>Ready to review</span>
              <span style={styles.dots}>•••</span>
            </div>
            <div style={styles.statusCardTitle}>
              {result ? `Hazır: "${result.filename}"` : "Çıktı incelemeye hazır"}
            </div>
            <div style={styles.statusCardDesc}>
              {result
                ? `${(result.key_points || []).length} madde ve ${(result.questions || []).length} çalışma sorusu üretildi.`
                : "Analiz tamamlandığında sonuçları tek tıkla kopyalayabilirsin."}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

const styles = {
  shell: {
    display: "grid",
    gridTemplateColumns: "250px minmax(0, 1fr) 300px",
    minHeight: "100vh",
    backgroundColor: "#141416",
    color: "#f4f4f6",
  },
  leftSidebar: {
    backgroundColor: "#18181b",
    borderRight: "1px solid #26262b",
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 20,
  },
  brandRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brandLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 6px)",
    gap: 3,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 2,
    background: "#e4e4e7",
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "-0.01em",
  },
  sidebarBadge: {
    fontSize: 10,
    fontWeight: 600,
    color: "#a1a1aa",
    border: "1px solid #2e2e34",
    borderRadius: 6,
    padding: "2px 6px",
  },
  searchBox: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#1f1f23",
    border: "1px solid #2b2b31",
    borderRadius: 8,
    padding: "7px 10px",
    gap: 8,
    marginBottom: 16,
  },
  searchIcon: {
    color: "#71717a",
    fontSize: 14,
  },
  searchInput: {
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#e4e4e7",
    fontSize: 13,
    width: "100%",
  },
  shortcutTag: {
    fontSize: 11,
    color: "#71717a",
    backgroundColor: "#27272c",
    padding: "2px 5px",
    borderRadius: 4,
  },
  navGroup: {
    marginBottom: 14,
  },
  navItemPrimary: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "9px 10px",
    borderRadius: 8,
    border: "none",
    color: "#f4f4f6",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  subNavList: {
    marginTop: 6,
    paddingLeft: 10,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  subNavItemActive: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "transparent",
    border: "none",
    color: "#f4f4f6",
    fontSize: 12.5,
    padding: "6px 8px",
    cursor: "pointer",
    textAlign: "left",
  },
  activeBar: {
    width: 2,
    height: 14,
    backgroundColor: "#a3e635",
    borderRadius: 2,
  },
  subNavItem: {
    background: "transparent",
    border: "none",
    color: "#8e8e98",
    fontSize: 12.5,
    padding: "6px 8px 6px 18px",
    cursor: "pointer",
    textAlign: "left",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    borderTop: "1px solid #242429",
    paddingTop: 12,
  },
  menuRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 8px",
    fontSize: 13,
    color: "#a1a1aa",
    borderRadius: 6,
  },
  counterPill: {
    fontSize: 11,
    color: "#d4d4d8",
    backgroundColor: "#26262c",
    padding: "1px 7px",
    borderRadius: 999,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    backgroundColor: "#4ade80",
  },
  workspaceInfo: {
    borderTop: "1px solid #242429",
    paddingTop: 12,
    marginBottom: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  workspaceRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 12.5,
    color: "#a1a1aa",
    padding: "0 6px",
  },
  orangeDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    backgroundColor: "#f97316",
  },
  bottomCard: {
    backgroundColor: "#1f1f24",
    border: "1px solid #2c2c33",
    borderRadius: 12,
    padding: 14,
  },
  bottomCardTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  bottomCardDesc: {
    fontSize: 11.5,
    color: "#9ca3af",
    lineHeight: 1.45,
    marginBottom: 12,
  },
  purpleFullBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    border: "none",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 12.5,
    fontWeight: 600,
    padding: "9px 12px",
    cursor: "pointer",
  },
  centerPanel: {
    padding: "24px 28px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  centerHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  greeting: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: "-0.02em",
  },
  subGreeting: {
    margin: "4px 0 0",
    fontSize: 13,
    color: "#8e8e98",
  },
  headerActions: {
    display: "flex",
    gap: 10,
  },
  iconCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#1d1d21",
    border: "1px solid #2c2c32",
    color: "#d4d4d8",
    fontSize: 14,
  },
  focusSection: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#d4d4d8",
  },
  pillRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  pillActive: {
    backgroundColor: "#84cc16",
    color: "#111810",
    border: "1px solid #a3e635",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  pillDefault: {
    backgroundColor: "#1d1d21",
    color: "#c4c4cc",
    border: "1px solid #2b2b31",
    borderRadius: 999,
    padding: "7px 14px",
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  },
  stageCard: {
    flex: 1,
    backgroundColor: "#18181b",
    border: "1px solid #26262c",
    borderRadius: 16,
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 18,
  },
  stageTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #242429",
    paddingBottom: 12,
  },
  stageTitle: {
    fontSize: 14.5,
    fontWeight: 500,
    color: "#f4f4f6",
  },
  refreshMiniBtn: {
    background: "transparent",
    border: "none",
    color: "#a1a1aa",
    fontSize: 15,
    cursor: "pointer",
  },
  stageBody: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    flex: 1,
  },
  conversationTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  botCluster: {
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  botOrb: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "radial-gradient(circle at 35% 30%, #818cf8, #4f46e5 55%, #1e1b4b 100%)",
    boxShadow: "0 0 28px rgba(99, 102, 241, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  botFace: {
    width: 38,
    height: 22,
    borderRadius: 12,
    backgroundColor: "#141329",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  botEye: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: "#67e8f9",
    boxShadow: "0 0 8px #67e8f9",
  },
  botStatusText: {
    fontSize: 12.5,
    color: "#8e8e98",
  },
  userBubble: {
    backgroundColor: "#242429",
    border: "1px solid #303037",
    borderRadius: 12,
    padding: "11px 15px",
    fontSize: 13,
    color: "#e4e4e7",
    maxWidth: 360,
    lineHeight: 1.45,
  },
  errorBanner: {
    backgroundColor: "rgba(185, 28, 28, 0.18)",
    border: "1px solid rgba(239, 68, 68, 0.45)",
    color: "#fca5a5",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 13,
  },
  goalContainer: {
    backgroundColor: "#1d1d21",
    border: "1px solid #292930",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  goalBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#c084fc",
    color: "#1a0b2e",
    fontSize: 10.5,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 5,
    letterSpacing: "0.04em",
  },
  goalText: {
    margin: 0,
    fontSize: 13.5,
    lineHeight: 1.55,
    color: "#e4e4e7",
  },
  phaseDivider: {
    height: 1,
    backgroundColor: "#292930",
    margin: "2px 0",
  },
  phaseRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  phaseTitle: {
    fontSize: 13.5,
    fontWeight: 600,
    color: "#f4f4f6",
  },
  phaseDesc: {
    fontSize: 12,
    color: "#8e8e98",
    marginTop: 2,
  },
  statusCompleted: {
    fontSize: 12,
    fontWeight: 600,
    color: "#4ade80",
    whiteSpace: "nowrap",
  },
  statusInProgress: {
    fontSize: 12,
    fontWeight: 600,
    color: "#a3e635",
    whiteSpace: "nowrap",
  },
  statusWaiting: {
    fontSize: 12,
    color: "#8e8e98",
    whiteSpace: "nowrap",
  },
  resultStack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  resultBlock: {
    backgroundColor: "#1d1d21",
    border: "1px solid #292930",
    borderRadius: 12,
    padding: 16,
  },
  resultBlockHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  summaryParagraph: {
    margin: 0,
    fontSize: 13.5,
    lineHeight: 1.6,
    color: "#e4e4e7",
  },
  bulletList: {
    margin: 0,
    paddingLeft: 18,
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  orderedList: {
    margin: 0,
    paddingLeft: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  listItem: {
    fontSize: 13.5,
    lineHeight: 1.5,
    color: "#e4e4e7",
  },
  composerWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  composerBar: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#202024",
    border: "1px solid #2f2f37",
    borderRadius: 12,
    padding: "8px 10px",
  },
  attachBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#2a2a30",
    border: "1px solid #383842",
    color: "#e4e4e7",
    cursor: "pointer",
    fontSize: 14,
  },
  sparkIcon: {
    color: "#a1a1aa",
    fontSize: 13,
  },
  composerInput: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f4f4f6",
    fontSize: 13,
  },
  fileChip: {
    fontSize: 11.5,
    color: "#d8b4fe",
    backgroundColor: "rgba(124, 58, 237, 0.2)",
    border: "1px solid rgba(168, 85, 247, 0.35)",
    padding: "3px 8px",
    borderRadius: 6,
    maxWidth: 150,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  sendBtn: {
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    border: "none",
    borderRadius: 8,
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 600,
    padding: "8px 16px",
    cursor: "pointer",
  },
  composerFootNote: {
    fontSize: 11,
    color: "#6b6b76",
    paddingLeft: 4,
  },
  rightSidebar: {
    backgroundColor: "#18181b",
    borderLeft: "1px solid #26262b",
    padding: "20px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 20,
  },
  rightHeader: {
    marginBottom: 14,
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#f4f4f6",
  },
  filterLabel: {
    fontSize: 11.5,
    color: "#8e8e98",
    marginBottom: 8,
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    marginBottom: 16,
  },
  selectFake: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#202025",
    border: "1px solid #2d2d34",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    color: "#d4d4d8",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  emptyHistory: {
    fontSize: 12,
    color: "#71717a",
    lineHeight: 1.5,
    padding: "8px 0",
  },
  historyItem: {
    background: "transparent",
    border: "none",
    padding: 0,
    textAlign: "left",
    fontSize: 12.5,
    lineHeight: 1.45,
    cursor: "pointer",
  },
  statusCardsStack: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  statusCard: {
    backgroundColor: "#1e1e22",
    border: "1px solid #2a2a31",
    borderRadius: 12,
    padding: 13,
  },
  statusCardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  badgeBlue: {
    backgroundColor: "#3b82f6",
    color: "#eff6ff",
    fontSize: 10.5,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 999,
  },
  badgeGreen: {
    backgroundColor: "#22c55e",
    color: "#052e16",
    fontSize: 10.5,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 999,
  },
  badgeAmber: {
    backgroundColor: "#eab308",
    color: "#1c1917",
    fontSize: 10.5,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 999,
  },
  dots: {
    color: "#71717a",
    fontSize: 12,
    letterSpacing: 1,
  },
  statusCardTitle: {
    fontSize: 13,
    fontWeight: 600,
    color: "#f4f4f6",
    marginBottom: 4,
  },
  statusCardDesc: {
    fontSize: 11.5,
    color: "#8e8e98",
    lineHeight: 1.45,
  },
};