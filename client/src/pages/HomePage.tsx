import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import UserMenu from "../components/UserMenu";
import "./HomePage.css";

interface CodeTab {
	id: string;
	title: string;
	content: string;
	language: string;
}

const HomePage: React.FC = () => {
	const { currentUser } = useAuth();
	const [tabs, setTabs] = useState<CodeTab[]>([
		{
			id: "1",
			title: "Untitled",
			content: "",
			language: "javascript",
		},
	]);
	const [activeTabId, setActiveTabId] = useState("1");
	const [isLoading, setIsLoading] = useState(false);
	const [shareUrl, setShareUrl] = useState("");
	const [authModalOpen, setAuthModalOpen] = useState(false);
	const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

	// Get active tab
	const activeTab = tabs.find((tab) => tab.id === activeTabId);

	// Tab management functions
	const addTab = () => {
		const newId = Date.now().toString();
		const newTab: CodeTab = {
			id: newId,
			title: "Untitled",
			content: "",
			language: "javascript",
		};
		setTabs([...tabs, newTab]);
		setActiveTabId(newId);
	};

	const removeTab = (tabId: string) => {
		if (tabs.length === 1) return; // Don't remove last tab

		const newTabs = tabs.filter((tab) => tab.id !== tabId);
		setTabs(newTabs);

		if (activeTabId === tabId) {
			setActiveTabId(newTabs[0].id);
		}
	};

	const updateTab = (tabId: string, updates: Partial<CodeTab>) => {
		setTabs(
			tabs.map((tab) => (tab.id === tabId ? { ...tab, ...updates } : tab))
		);
	};

	const handleShare = async () => {
		// Check if any tab has content
		const hasContent = tabs.some((tab) => tab.content.trim());
		if (!hasContent) {
			showNotification(
				"Please enter some code in at least one tab to share",
				"error"
			);
			return;
		}

		setIsLoading(true);
		try {
			const headers: any = {
				'Content-Type': 'application/json'
			};

			// Add authentication token if user is signed in
			if (currentUser) {
				const token = await currentUser.getIdToken();
				headers.Authorization = `Bearer ${token}`;
			}

			const response = await axios.post("/api/paste", {
				tabs: tabs.map((tab) => ({
					title: tab.title || "Untitled",
					content: tab.content,
					language: tab.language,
				})),
				title: "Multi-tab paste",
			}, { headers });

			// Generate the correct URL for development/production
			const baseUrl =
				process.env.NODE_ENV === "production"
					? window.location.origin
					: "http://localhost:3000";
			const shareUrl = `${baseUrl}/${response.data.id}`;

			setShareUrl(shareUrl);

			// Copy to clipboard with fallback for mobile
			try {
				await copyToClipboard(shareUrl);
				showNotification("Link copied to clipboard! 🎉", "success");
			} catch (clipboardError) {
				console.warn("Clipboard copy failed, but paste created successfully:", clipboardError);
				showNotification("Paste created successfully! (Copy manually if needed)", "success");
			}
		} catch (error) {
			console.error("Share error:", error);
			showNotification("Failed to create paste. Please try again.", "error");
		} finally {
			setIsLoading(false);
		}
	};

	const copyToClipboard = async (text: string): Promise<void> => {
		// Modern clipboard API (works in HTTPS contexts)
		if (navigator.clipboard && window.isSecureContext) {
			try {
				await navigator.clipboard.writeText(text);
				return;
			} catch (err) {
				console.warn("Modern clipboard API failed:", err);
			}
		}

		// Fallback method for mobile/older browsers
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild(textArea);
		
		try {
			textArea.focus();
			textArea.select();
			textArea.setSelectionRange(0, 99999); // For mobile devices
			
			const successful = document.execCommand('copy');
			if (!successful) {
				throw new Error('execCommand failed');
			}
		} finally {
			document.body.removeChild(textArea);
		}
	};

	const showNotification = (message: string, type: "success" | "error") => {
		// Create notification element
		const notification = document.createElement("div");
		notification.className = `notification notification-${type}`;
		notification.textContent = message;

		// Add styles - better positioning for mobile
		Object.assign(notification.style, {
			position: "fixed",
			top: "20px",
			left: "50%",
			transform: "translateX(-50%) translateY(-20px)",
			padding: "12px 20px",
			borderRadius: "8px",
			color: "white",
			fontWeight: "500",
			zIndex: "10000",
			opacity: "0",
			transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
			backgroundColor: type === "success" ? "#4caf50" : "#f44336",
			boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
			maxWidth: "90vw",
			textAlign: "center",
		});

		document.body.appendChild(notification);

		// Animate in
		requestAnimationFrame(() => {
			notification.style.opacity = "1";
			notification.style.transform = "translateX(-50%) translateY(0)";
		});

		// Remove after 3 seconds
		setTimeout(() => {
			notification.style.opacity = "0";
			notification.style.transform = "translateX(-50%) translateY(-20px)";
			setTimeout(() => {
				if (document.body.contains(notification)) {
					document.body.removeChild(notification);
				}
			}, 300);
		}, 3000);
	};

	const handleNewPaste = () => {
		setTabs([
			{
				id: "1",
				title: "Untitled",
				content: "",
				language: "javascript",
			},
		]);
		setActiveTabId("1");
		setShareUrl("");
	};

	const handleOpenAuth = (mode: 'login' | 'signup') => {
		setAuthMode(mode);
		setAuthModalOpen(true);
	};

	const handleSwitchAuthMode = () => {
		setAuthMode(authMode === 'login' ? 'signup' : 'login');
	};

	const languages = [
		"javascript",
		"typescript",
		"python",
		"java",
		"cpp",
		"csharp",
		"go",
		"rust",
		"php",
		"ruby",
		"swift",
		"kotlin",
		"html",
		"css",
		"json",
		"xml",
		"yaml",
		"sql",
		"text",
	];

	return (
		<div className="home-page">
			<header className="header">
				<div className="header-content">
					<div className="header-left">
						<h1 className="logo">InstaBin</h1>
						<p className="tagline">Share code instantly</p>
					</div>
					<div className="header-right">
						<UserMenu onOpenAuth={handleOpenAuth} />
					</div>
				</div>
			</header>

			{shareUrl ? (
				<div className="share-success">
					<div className="success-content">
						<h2>Code shared successfully!</h2>
						<div className="url-container">
							<input
								type="text"
								value={shareUrl}
								readOnly
								className="share-url"
							/>
							<button
								onClick={async () => {
									try {
										await copyToClipboard(shareUrl);
										showNotification("Link copied! 📋", "success");
									} catch (err) {
										showNotification("Please copy the link manually", "error");
									}
								}}
								className="copy-btn"
							>
								Copy
							</button>
						</div>
						<div className="actions">
							<a
								href={shareUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="view-btn"
							>
								View Paste
							</a>
							<button onClick={handleNewPaste} className="new-btn">
								Create New
							</button>
						</div>
					</div>
				</div>
			) : (
				<main className="main-content">
					<div className="controls">
						<div className="control-group">
							<input
								type="text"
								placeholder="Tab title (optional)"
								value={activeTab?.title || ""}
								onChange={(e) =>
									updateTab(activeTabId, { title: e.target.value })
								}
								className="title-input"
							/>
							<select
								value={activeTab?.language || "javascript"}
								onChange={(e) =>
									updateTab(activeTabId, { language: e.target.value })
								}
								className="language-select"
							>
								{languages.map((lang) => (
									<option key={lang} value={lang}>
										{lang.charAt(0).toUpperCase() + lang.slice(1)}
									</option>
								))}
							</select>
						</div>
						<button
							onClick={handleShare}
							disabled={isLoading}
							className={`share-button ${isLoading ? "loading" : ""}`}
						>
							{isLoading && <div className="spinner"></div>}
							{isLoading ? "Sharing..." : "Share All Tabs"}
						</button>
					</div>

					<div className="tabs-container">
						<div className="tabs-header">
							{tabs.map((tab) => (
								<div
									key={tab.id}
									className={`tab ${activeTabId === tab.id ? "active" : ""}`}
									onClick={() => setActiveTabId(tab.id)}
								>
									<span className="tab-title">
										{tab.title || "Untitled"}
										<span className="tab-language">({tab.language})</span>
									</span>
									{tabs.length > 1 && (
										<button
											className="tab-close"
											onClick={(e) => {
												e.stopPropagation();
												removeTab(tab.id);
											}}
										>
											×
										</button>
									)}
								</div>
							))}
							<button className="add-tab" onClick={addTab}>
								+
							</button>
						</div>

						<div className="editor-container">
							<Editor
								key={activeTabId} // Force re-render when tab changes
								height="calc(100vh - 280px)"
								language={activeTab?.language || "javascript"}
								theme="vs-dark"
								value={activeTab?.content || ""}
								onChange={(value) =>
									updateTab(activeTabId, { content: value || "" })
								}
								options={{
									minimap: { enabled: false },
									fontSize: 14,
									wordWrap: "on",
									automaticLayout: true,
									scrollBeyondLastLine: false,
									renderLineHighlight: "none",
									overviewRulerBorder: false,
									hideCursorInOverviewRuler: true,
									overviewRulerLanes: 0,
								}}
							/>
						</div>
					</div>
				</main>
			)}

			<footer className="footer">
				&copy;{" "}
				<a
					href="https://asymptotelabs.github.io"
					target="_blank"
					rel="noopener noreferrer"
				>
					Asymptote Labs
				</a>
			</footer>

			{isLoading && (
				<div className="loading-overlay">
					<div className="loading-spinner"></div>
				</div>
			)}

			<AuthModal
				isOpen={authModalOpen}
				onClose={() => setAuthModalOpen(false)}
				mode={authMode}
				onSwitchMode={handleSwitchAuthMode}
			/>
		</div>
	);
};

export default HomePage;
