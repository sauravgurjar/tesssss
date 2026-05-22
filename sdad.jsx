import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  CircularProgress,
  Tooltip,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Collapse,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  HourglassEmpty,
  PlayArrow,
  CloudUpload,
  QuestionAnswer,
  Description,
  ArrowBack,
} from "@mui/icons-material";
import Select from "./select.jsx";
import FormField from "./formField.jsx";
import {
  fetchCategoryList,
  fetchKnowledgBase,
  fetchSubCategoryList,
  uploadDocument,
  submitDocument,
  checkDocmentStatus,
  fetchDocumentDetails,
} from "../../API/calls/uploaddoument.js";
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from "./customSnackbar.jsx";
import Navbar from "./navbar.jsx";
import Header from "../../Screens/componets/header.jsx";
import { downloadDocuments } from "../../API/calls/downloadcsv.js";
import { BASE_URL_GEN_AGENTIC_SEARCH } from "../../helper/constants.js";

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState = {
  selectedCategory: null,
  selectedSubCategory: null,
  lastModifiedDate: "",
  selectedCollection: null,
  parsingInstructions: null,
  fileBlob: null,
  qnaFileBlob: null,
  metaData: [],
  description: "",
  docId: null,
  doc_group_id: null,
  jobId: null,
  qnaJobId: null,
  docURL: null,
  fileMetaData: null,
  version: null,
  fileName: null,
  uploadResponse: null,
  qnaFileName: null,
  category_id: null,
  sub_category_id: null,
};

// ─── Status Configs ───────────────────────────────────────────────────────────
const getDocStatusConfig = (status) => {
  switch (status) {
    case "pending":
      return {
        icon: <HourglassEmpty sx={{ fontSize: 22, color: "#f59e0b" }} />,
        color: "#fffbeb",
        borderColor: "#f59e0b",
        badgeColor: "#f59e0b",
        title: "Processing Queued",
        message: "Your document is in the queue and will be processed shortly.",
        showProgress: true,
      };
    case "running":
      return {
        icon: <PlayArrow sx={{ fontSize: 22, color: "#3b82f6" }} />,
        color: "#eff6ff",
        borderColor: "#3b82f6",
        badgeColor: "#3b82f6",
        title: "Processing Document",
        message: "Your document is being processed. This may take a few minutes.",
        showProgress: true,
      };
    case "ended":
      return {
        icon: <CheckCircle sx={{ fontSize: 22, color: "#10b981" }} />,
        color: "#f0fdf4",
        borderColor: "#10b981",
        badgeColor: "#10b981",
        title: "Processing Complete",
        message: "Your document has been successfully processed and is now available.",
        showProgress: false,
      };
    case "failed":
      return {
        icon: <Error sx={{ fontSize: 22, color: "#ef4444" }} />,
        color: "#fef2f2",
        borderColor: "#ef4444",
        badgeColor: "#ef4444",
        title: "Processing Failed",
        message: "An error occurred while processing your document. Please try again.",
        showProgress: false,
      };
    default:
      return null;
  }
};

const getQnaStatusConfig = (status) => {
  switch (status) {
    case "pending":
      return {
        icon: <HourglassEmpty sx={{ fontSize: 22, color: "#f59e0b" }} />,
        color: "#fffbeb",
        borderColor: "#f59e0b",
        title: "QnA Upload Queued",
        message: "Your QnA file is in the processing queue.",
        showProgress: true,
      };
    case "running":
      return {
        icon: <PlayArrow sx={{ fontSize: 22, color: "#3b82f6" }} />,
        color: "#eff6ff",
        borderColor: "#3b82f6",
        title: "Processing QnA",
        message: "Your QnA file is being processed.",
        showProgress: true,
      };
    case "ended":
      return {
        icon: <CheckCircle sx={{ fontSize: 22, color: "#10b981" }} />,
        color: "#f0fdf4",
        borderColor: "#10b981",
        title: "QnA Processed",
        message: "Your QnA file has been successfully processed.",
        showProgress: false,
      };
    case "failed":
      return {
        icon: <Error sx={{ fontSize: 22, color: "#ef4444" }} />,
        color: "#fef2f2",
        borderColor: "#ef4444",
        title: "QnA Processing Failed",
        message: "An error occurred while processing your QnA file.",
        showProgress: false,
      };
    default:
      return null;
  }
};

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ jobId, status, onClose, docLogs, configFn }) {
  if (!status) return null;
  const config = configFn(status);
  if (!config) return null;

  return (
    <Collapse in={!!status}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          bgcolor: config.color,
          border: `1.5px solid ${config.borderColor}`,
          borderRadius: "12px",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
          <Box sx={{ mt: 0.2, flexShrink: 0 }}>{config.icon}</Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.3 }}>
              {config.title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#666" }}>
              {config.message}
            </Typography>
            {jobId && (
              <Typography sx={{ fontSize: 11, color: "#aaa", mt: 0.5 }}>
                Job ID: {jobId}
              </Typography>
            )}
            {config.showProgress && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress
                  variant="indeterminate"
                  sx={{
                    height: 5,
                    borderRadius: 4,
                    bgcolor: "rgba(0,0,0,0.08)",
                    "& .MuiLinearProgress-bar": { bgcolor: config.borderColor },
                  }}
                />
                {docLogs && (
                  <Box
                    sx={{
                      mt: 1.5,
                      p: 1.5,
                      bgcolor: "rgba(0,0,0,0.04)",
                      borderRadius: "8px",
                      maxHeight: 100,
                      overflowY: "auto",
                    }}
                  >
                    {docLogs.split("\n").map((log, i) => (
                      <Typography
                        key={i}
                        sx={{
                          fontSize: 11,
                          color: "#666",
                          fontFamily: "monospace",
                          lineHeight: 1.6,
                        }}
                      >
                        {log}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
            {(status === "ended" || status === "failed") && onClose && (
              <Button
                size="small"
                variant={status === "ended" ? "contained" : "outlined"}
                color={status === "ended" ? "success" : "error"}
                onClick={onClose}
                sx={{ mt: 1.5, borderRadius: "8px", textTransform: "none", fontSize: 12 }}
              >
                {status === "ended" ? "Continue" : "Dismiss"}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Collapse>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ label, icon, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 20px",
        border: "none",
        borderBottom: active ? "2.5px solid #1d4ed8" : "2.5px solid transparent",
        background: "transparent",
        cursor: "pointer",
        color: active ? "#1d4ed8" : "#6b7280",
        fontWeight: active ? 600 : 400,
        fontSize: 14,
        fontFamily: "inherit",
        transition: "all 0.2s",
        position: "relative",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
      {badge && (
        <span
          style={{
            background: "#10b981",
            color: "#fff",
            borderRadius: "999px",
            fontSize: 10,
            padding: "1px 6px",
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, accent }) {
  return (
    <Box
      sx={{
        bgcolor: "#fff",
        border: accent ? `1.5px solid ${accent}` : "1px solid #e5e7eb",
        borderRadius: "14px",
        overflow: "hidden",
        mb: 2.5,
      }}
    >
      {title && (
        <Box
          sx={{
            px: 2.5,
            py: 1.5,
            borderBottom: "1px solid #f3f4f6",
            bgcolor: accent ? `${accent}08` : "#fafafa",
          }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: accent || "#374151" }}>
            {title}
          </Typography>
        </Box>
      )}
      <Box sx={{ p: 2.5 }}>{children}</Box>
    </Box>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function FileUpload() {
  const location = useLocation();
  const fileInputRef = useRef(null);
  const qnaFileInputRef = useRef(null);
  const [formData, setFormData] = useState(initialState);
  const [activeTab, setActiveTab] = useState("upload");
  const [newMetaTag, setNewMetaTag] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isQnaUploading, setIsQnaUploading] = useState(false);
  const [isQnaSubmitted, setIsQnaSubmitted] = useState(false);
  const [isDocSubmitted, setIsDocSubmitted] = useState(false);
  const [collectionList, setCollectionList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [subCategoryList, setSubCategoryList] = useState([]);
  const [jobStatus, setJobStatus] = useState(null);
  const [docLogs, setDocLogs] = useState("");
  const [fileURL, setFileURL] = useState(null);
  const [qnaJobStatus, setQnaJobStatus] = useState(null);
  const [qnaDocLogs, setQnaDocLogs] = useState("");

  const pollingActiveRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const prevJobStatusRef = useRef(null);
  const docLogsRef = useRef("");

  const qnaPollingActiveRef = useRef(false);
  const qnaPollingIntervalRef = useRef(null);
  const qnaPollingTimeoutRef = useRef(null);
  const prevQnaStatusRef = useRef(null);

  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const {
    selectedCategory, selectedSubCategory, lastModifiedDate,
    selectedCollection, parsingInstructions, fileBlob, qnaFileBlob,
    metaData, category_id, sub_category_id, description, docId,
    doc_group_id, docURL, fileMetaData, version, jobId, qnaJobId,
    fileName, qnaFileName, uploadResponse,
  } = formData;

  const isDisabled = !selectedCollection || !selectedCategory;
  const userId = sessionStorage.getItem("userId");
  const queryParams = new URLSearchParams(location.search);
  const shouldShowQnaSection = !!queryParams.get("doc_id");
  const isEdit = !!queryParams.get("doc_id");
  const doc_id = queryParams.get("doc_id");
  const departmentName = queryParams.get("department_name");

  // ── Polling helpers ─────────────────────────────────────────────────────────
  const stopPolling = () => {
    clearInterval(pollingIntervalRef.current);
    clearTimeout(pollingTimeoutRef.current);
    pollingIntervalRef.current = null;
    pollingTimeoutRef.current = null;
    pollingActiveRef.current = false;
    prevJobStatusRef.current = null;
  };

  const stopQnaPolling = () => {
    clearInterval(qnaPollingIntervalRef.current);
    clearTimeout(qnaPollingTimeoutRef.current);
    qnaPollingIntervalRef.current = null;
    qnaPollingTimeoutRef.current = null;
    qnaPollingActiveRef.current = false;
    prevQnaStatusRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopPolling();
      stopQnaPolling();
      if (fileURL) URL.revokeObjectURL(fileURL);
    };
  }, [fileURL]);

  // ── Init data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const initializeData = async () => {
      try {
        if (!isEdit) {
          const collections = await fetchKnowledgBase();
          setCollectionList(collections || []);
        } else {
          if (doc_id && departmentName) {
            const data = await fetchDocumentDetails({ doc_id, department: departmentName });
            if (data && data.length > 0) {
              const d = data[0];
              setFormData((prev) => ({
                ...prev,
                docId: d.doc_id,
                doc_group_id: d.doc_group_id,
                selectedCollection: { id: d.department_id, name: d.department },
                selectedCategory: { name: d.category },
                selectedSubCategory: { name: d.sub_category },
                version: d.version,
                description: d.doc_summary,
                metaData: Array.isArray(d?.metadata?.llm_generated)
                  ? d.metadata.llm_generated
                  : d?.metadata?.llm_generated?.doc_metadata || [],
                fileName: d.doc_name,
                lastModifiedDate: d.last_updated_on
                  ? new Date(d.last_updated_on).toISOString().split("T")[0]
                  : "",
                parsingInstructions: d.parsing_instructions,
                category_id: d.category_id ?? null,
                sub_category_id: d.sub_category_id ?? null,
              }));
            }
          }
        }
      } catch (error) {
        showSnackbar("Failed to load initial data", "error");
      }
    };
    initializeData();
  }, [isEdit, doc_id, departmentName, showSnackbar]);

  useEffect(() => {
    const loadCategories = async () => {
      if (isEdit || !selectedCollection?.id) return;
      try {
        const categories = await fetchCategoryList({ department_id: selectedCollection.id });
        setCategoryList(categories || []);
      } catch { setCategoryList([]); }
    };
    loadCategories();
    if (!isEdit) setFormData((p) => ({ ...p, selectedCategory: null, selectedSubCategory: null }));
  }, [selectedCollection, isEdit]);

  useEffect(() => {
    const loadSubCategories = async () => {
      if (isEdit || !selectedCategory?.id || !selectedCollection?.id) return;
      try {
        const subs = await fetchSubCategoryList({ department_id: selectedCollection.id, category_id: selectedCategory.id });
        setSubCategoryList(subs || []);
      } catch { setSubCategoryList([]); }
    };
    loadSubCategories();
    if (!isEdit) setFormData((p) => ({ ...p, selectedSubCategory: null }));
  }, [selectedCategory, selectedCollection, isEdit]);

  useEffect(() => {
    let url;
    if (fileBlob) { url = URL.createObjectURL(fileBlob); setFileURL(url); }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [fileBlob]);

  // ── File handlers ───────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "application/pdf") {
      showSnackbar("Please select a valid PDF file.", "error");
      return;
    }
    setFormData((p) => ({ ...p, fileBlob: file, fileName: file.name }));
  };

  const handleQnaFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== "text/csv") {
      showSnackbar("Please select a valid CSV file.", "error");
      return;
    }
    setFormData((p) => ({ ...p, qnaFileBlob: file, qnaFileName: file.name }));
  };

  const triggerFileSelect = () => {
    setFormData((p) => ({ ...p, fileBlob: null, fileName: null, metaData: [], description: "", docURL: null, fileMetaData: null }));
    fileInputRef.current?.click();
  };

  const triggerQnaFileSelect = () => qnaFileInputRef.current?.click();

  const removeQnaFile = () => setFormData((p) => ({ ...p, qnaFileBlob: null, qnaFileName: null }));

  const handleAddMetaTag = () => {
    const t = newMetaTag.trim();
    if (t && !metaData.includes(t)) setFormData((p) => ({ ...p, metaData: [...p.metaData, t] }));
    setNewMetaTag("");
  };

  const handleDeleteMetaTag = (tag) =>
    setFormData((p) => ({ ...p, metaData: p.metaData.filter((x) => x !== tag) }));

  const handleDownloadSample = async () => {
    try {
      const response = await downloadDocuments("gs://asknow-docs/Front-end/Sample KB Wise FAQ Upload.csv");
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "qna_sample.csv";
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      showSnackbar("Failed to download sample CSV", "error");
    }
  };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!fileBlob || !selectedCollection || !selectedCategory) {
      showSnackbar("Please fill all required fields and select a file.", "error");
      return;
    }
    setIsUploading(true);
    try {
      const result = await uploadDocument({
        file: fileBlob,
        use_case: selectedCollection?.name,
        category: selectedCategory?.name,
        doc_name: fileBlob?.name,
        mime_type: "application/pdf",
        sub_category: selectedSubCategory?.name || "",
        author_id: userId,
        department_id: selectedCollection.id,
      });
      setFormData((p) => ({
        ...p,
        jobId: result?.job_id || null,
        metaData: result?.summary?.doc_metadata || [],
        description: result?.summary?.summary || "",
        docURL: result?.doc_url,
        fileMetaData: result?.metadata,
        uploadResponse: result,
        category_id: result?.category_id ?? p.category_id,
        sub_category_id: result?.sub_category_id ?? p.sub_category_id,
      }));
      showSnackbar("Document uploaded successfully", "success");
    } catch {
      showSnackbar("Failed to upload document", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // ── QnA Submit + FAQ polling ─────────────────────────────────────────────────
  const startQnaPolling = (jId, department, totalRecord) => {
    if (qnaPollingActiveRef.current) return;
    qnaPollingActiveRef.current = true;

    qnaPollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(
          `${BASE_URL_GEN_AGENTIC_SEARCH}/jobs/status_poll_faq?job_id=${jId}&department=${encodeURIComponent(department)}&total_record=${totalRecord}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              accept: "application/json",
              ...(userId ? { "X-USER-ID": userId } : {}),
            },
          }
        );
        const data = await response.json();
        const newStatus = data?.documents?.[0]?.doc_processing_status || data?.job_status;
        const logs = data?.documents?.[0]?.doc_logs || "";

        if (newStatus !== prevQnaStatusRef.current) {
          setQnaJobStatus(newStatus);
          setQnaDocLogs(logs);
          if (newStatus === "failed") {
            stopQnaPolling();
            setIsQnaSubmitted(false);
          } else if (newStatus === "ended" || data?.job_status === "ended") {
            stopQnaPolling();
            setIsQnaSubmitted(false);
            setTimeout(() => { setQnaJobStatus(null); setQnaDocLogs(""); }, 5000);
          }
        }
        prevQnaStatusRef.current = newStatus;
      } catch {
        setQnaJobStatus("failed");
        setIsQnaSubmitted(false);
        stopQnaPolling();
      }
    }, 15000);

    qnaPollingTimeoutRef.current = setTimeout(() => {
      if (qnaPollingActiveRef.current) {
        setQnaJobStatus("failed");
        setIsQnaSubmitted(false);
        stopQnaPolling();
      }
    }, 600000);
  };

  const handleQnaSubmit = async () => {
    if (!qnaFileBlob) { showSnackbar("Please select a QnA CSV file first.", "error"); return; }
    if (!docId) { showSnackbar("Please submit the main document first.", "error"); return; }

    setIsQnaUploading(true);
    setIsQnaSubmitted(true);

    const payload = new FormData();
    payload.append("file", qnaFileBlob);
    payload.append("department", selectedCollection?.name);
    payload.append("category", selectedCategory?.name);
    payload.append("sub_category", selectedSubCategory?.name || "");
    payload.append("doc_name", qnaFileBlob.name);
    payload.append("doc_id", docId);
    payload.append("mime_type", "text/csv");

    try {
      const response = await fetch(`${BASE_URL_GEN_AGENTIC_SEARCH}/jobs/upload_qna`, {
        method: "POST",
        credentials: "include",
        headers: { accept: "application/json", ...(userId ? { "X-User-ID": userId } : {}) },
        body: payload,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      const qId = result?.job_id || null;
      setFormData((p) => ({ ...p, qnaJobId: qId }));
      showSnackbar("QnA file submitted successfully", "success");

      // Start FAQ status polling
      if (qId) {
        setQnaJobStatus("pending");
        startQnaPolling(qId, selectedCollection?.name, result?.total_record ?? 10);
      }
      return result;
    } catch {
      setIsQnaSubmitted(false);
      showSnackbar("Failed to submit QnA file", "error");
      return null;
    } finally {
      setIsQnaUploading(false);
    }
  };

  // ── Doc polling ─────────────────────────────────────────────────────────────
  const startPolling = (jId) => {
    if (pollingActiveRef.current) return;
    pollingActiveRef.current = true;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await checkDocmentStatus(jId);
        const newStatus = response?.documents?.[0]?.doc_processing_status;
        const logs = response?.documents?.[0]?.doc_logs || "";
        if (newStatus !== prevJobStatusRef.current) {
          setJobStatus(newStatus);
          setDocLogs(logs);
          docLogsRef.current = logs;
          if (newStatus === "failed") { stopPolling(); setIsDocSubmitted(false); }
          else if (response.job_status === "ended") {
            stopPolling(); setIsDocSubmitted(false);
            setTimeout(() => { setJobStatus(null); setDocLogs(""); docLogsRef.current = ""; setFormData(initialState); }, 5000);
          }
        } else if (logs !== docLogsRef.current) { setDocLogs(logs); docLogsRef.current = logs; }
        prevJobStatusRef.current = newStatus;
      } catch {
        setJobStatus("failed"); setIsDocSubmitted(false); stopPolling();
      }
    }, 15000);

    pollingTimeoutRef.current = setTimeout(() => {
      if (pollingActiveRef.current) { setJobStatus("failed"); setIsDocSubmitted(false); stopPolling(); }
    }, 600000);
  };

  // ── Doc submit ──────────────────────────────────────────────────────────────
  const handleDocumentSubmit = async () => {
    if (!fileBlob || !selectedCollection || !selectedCategory) {
      showSnackbar("Please fill all required fields and select a file.", "error");
      return;
    }
    if (!jobId || !docURL) { showSnackbar("Please upload the document first.", "error"); return; }
    setIsDocSubmitted(true);
    try {
      const payload = {
        ...uploadResponse,
        ...(isEdit && { doc_group_id, version }),
      };
      const response = await submitDocument(payload);
      const submitJobId = response?.job_id;
      setFormData((p) => ({ ...p, jobId: submitJobId }));
      setJobStatus("pending");
      startPolling(submitJobId);
    } catch (err) {
      setIsDocSubmitted(false);
      if (err?.status === 409) { showSnackbar("Duplicate document uploaded", "error"); return; }
      showSnackbar("Document submission failed", "error");
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const qnaBadge = qnaJobStatus === "ended" ? "✓" : qnaJobStatus === "running" ? "●" : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Header title="Upload Document" onBack={() => navigate("/search")} />

      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2, md: 3 }, pt: 2, pb: 6 }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>
            {isEdit ? "Edit Document" : "Upload Document"}
          </Typography>
          {isEdit && (
            <Typography sx={{ fontSize: 13, color: "#6b7280", mt: 0.5 }}>
              {fileName} · version {version ?? "1.0.0"}
            </Typography>
          )}
        </Box>

        {/* ── Tab bar ─────────────────────────────────────────────────────── */}
        <Box
          sx={{
            display: "flex",
            borderBottom: "1.5px solid #e5e7eb",
            mb: 3,
            gap: 0,
          }}
        >
          <TabBtn
            label="Document Upload"
            icon={<Description sx={{ fontSize: 17 }} />}
            active={activeTab === "upload"}
            onClick={() => setActiveTab("upload")}
          />
          {shouldShowQnaSection && (
            <TabBtn
              label="QnA Upload"
              icon={<QuestionAnswer sx={{ fontSize: 17 }} />}
              active={activeTab === "qna"}
              onClick={() => setActiveTab("qna")}
              badge={qnaBadge}
            />
          )}
        </Box>

        {/* ══════════════════════════════════════════════════════════════════
            TAB: DOCUMENT UPLOAD
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "upload" && (
          <>
            {/* Doc status banner */}
            <StatusBanner
              jobId={jobId}
              status={jobStatus}
              docLogs={docLogs}
              configFn={getDocStatusConfig}
              onClose={() => {
                setJobStatus(null); setDocLogs(""); docLogsRef.current = ""; setIsDocSubmitted(false);
                if (jobStatus === "ended") setFormData(initialState);
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "380px 1fr" },
                gap: 3,
                alignItems: "start",
              }}
            >
              {/* ── Left: Document info ──────────────────────────────────── */}
              <Box>
                <SectionCard title="Document Information">
                  <FormField label="Knowledge Base Collection" required>
                    {isEdit ? (
                      <TextField fullWidth variant="outlined" size="small" disabled value={selectedCollection?.name ?? ""} />
                    ) : (
                      <Select
                        label="Knowledge Base Collection"
                        labelKey="name"
                        data={collectionList}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p, selectedCollection: v, selectedCategory: null,
                            selectedSubCategory: null, category_id: null, sub_category_id: null,
                          }))
                        }
                        value={selectedCollection}
                      />
                    )}
                  </FormField>

                  <FormField label="Category" required>
                    {isEdit ? (
                      <TextField fullWidth variant="outlined" size="small" disabled value={selectedCategory?.name ?? ""} />
                    ) : (
                      <Select
                        label="Category"
                        labelKey="name"
                        data={categoryList}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p, selectedCategory: v, selectedSubCategory: null,
                            category_id: v?.id ?? null, sub_category_id: null,
                          }))
                        }
                        value={selectedCategory}
                      />
                    )}
                  </FormField>

                  <FormField label="Sub Category">
                    {isEdit ? (
                      <TextField fullWidth variant="outlined" size="small" disabled value={selectedSubCategory?.name ?? ""} />
                    ) : (
                      <Select
                        label="Sub Category"
                        labelKey="name"
                        data={subCategoryList}
                        onChange={(v) =>
                          setFormData((p) => ({
                            ...p, selectedSubCategory: v, sub_category_id: v?.id ?? null,
                          }))
                        }
                        value={selectedSubCategory}
                      />
                    )}
                  </FormField>

                  {isEdit && (
                    <FormField label="Last Modified Date">
                      <TextField fullWidth type="date" variant="outlined" size="small" value={lastModifiedDate} disabled />
                    </FormField>
                  )}

                  <FormField label="Process Instructions">
                    <TextField
                      fullWidth multiline minRows={4} variant="outlined" size="small"
                      placeholder="Enter parsing instructions..."
                      value={parsingInstructions || ""}
                      onChange={(e) => setFormData((p) => ({ ...p, parsingInstructions: e.target.value }))}
                    />
                  </FormField>
                </SectionCard>
              </Box>

              {/* ── Right: Upload + Metadata + Description ───────────────── */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>

                {/* File upload zone */}
                <SectionCard title="Upload PDF">
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 3,
                      border: "2px dashed",
                      borderColor: fileBlob ? "#10b981" : "#d1d5db",
                      borderRadius: "12px",
                      bgcolor: fileBlob ? "#f0fdf4" : "#f9fafb",
                      minHeight: 180,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                  >
                    {!isUploading && !fileBlob && (
                      <>
                        <CloudUpload sx={{ fontSize: 40, color: "#d1d5db", mb: 1.5 }} />
                        <Typography sx={{ fontSize: 14, color: "#6b7280", mb: 0.5 }}>
                          Select your PDF document
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#9ca3af", mb: 2 }}>
                          Only PDF files are supported
                        </Typography>
                        <Tooltip title={isDisabled ? "Please fill all required fields before proceeding" : ""}>
                          <span>
                            <Button
                              variant="contained"
                              onClick={triggerFileSelect}
                              disabled={isDisabled}
                              startIcon={<CloudUpload />}
                              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                            >
                              Browse Files
                            </Button>
                          </span>
                        </Tooltip>
                        <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} />
                      </>
                    )}

                    {isUploading && (
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5 }}>
                        <CircularProgress size={36} color="primary" />
                        <Typography sx={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>Uploading PDF…</Typography>
                        <Typography sx={{ fontSize: 12, color: "#9ca3af" }}>Please wait while we process your file</Typography>
                      </Box>
                    )}

                    {fileBlob && !isUploading && (
                      <Box sx={{ width: "100%" }}>
                        <embed
                          src={fileURL}
                          type="application/pdf"
                          width="100%"
                          height="180px"
                          style={{ border: "1px solid #e5e7eb", borderRadius: "8px", marginBottom: 12 }}
                        />
                        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
                          <Button
                            variant="outlined" size="small" onClick={triggerFileSelect}
                            sx={{ borderRadius: "8px", textTransform: "none" }}
                          >
                            Change File
                          </Button>
                          {!docURL && (
                            <Button
                              variant="contained" size="small" onClick={handleUpload}
                              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                            >
                              Upload
                            </Button>
                          )}
                        </Box>
                        {docURL && (
                          <Alert severity="success" sx={{ mt: 1.5, borderRadius: "8px", fontSize: 13 }}>
                            Document uploaded successfully!
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                </SectionCard>

                {/* Metadata */}
                <SectionCard title="Metadata">
                  <Box
                    sx={{
                      display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1.5,
                      minHeight: 40, p: 1.5, border: "1px solid #e5e7eb",
                      borderRadius: "8px", bgcolor: "#fafafa",
                    }}
                  >
                    {metaData?.length === 0 && (
                      <Typography sx={{ fontSize: 13, color: "#9ca3af" }}>
                        No metadata available for this document
                      </Typography>
                    )}
                    {metaData?.map((tag, i) => (
                      <Chip
                        key={`${tag}-${i}`} label={tag}
                        onDelete={() => handleDeleteMetaTag(tag)}
                        color="primary" size="small"
                        sx={{ borderRadius: "6px", fontSize: 12 }}
                      />
                    ))}
                  </Box>
                  <TextField
                    size="small" fullWidth
                    placeholder="Add metadata and press Enter"
                    value={newMetaTag}
                    onChange={(e) => setNewMetaTag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddMetaTag(); } }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                  />
                </SectionCard>

                {/* Description */}
                <SectionCard title="Description">
                  {description ? (
                    <TextField
                      multiline rows={4} fullWidth variant="outlined"
                      placeholder="Enter document description..."
                      value={description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      sx={{ fontSize: 13, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                    />
                  ) : (
                    <Typography sx={{ fontSize: 13, color: "#9ca3af", p: 1.5, border: "1px dashed #e5e7eb", borderRadius: "8px" }}>
                      Description will be extracted automatically after upload.
                    </Typography>
                  )}
                </SectionCard>
              </Box>
            </Box>

            {/* Submit button */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button
                variant="contained" size="large"
                disabled={isDisabled || !docURL || isDocSubmitted}
                onClick={handleDocumentSubmit}
                sx={{
                  minWidth: 200, py: 1.5, borderRadius: "10px",
                  textTransform: "none", fontWeight: 700, fontSize: 15,
                }}
              >
                {isDocSubmitted && <CircularProgress size={18} sx={{ mr: 1, color: "#fff" }} />}
                Submit Document
              </Button>
            </Box>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: QnA UPLOAD
        ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "qna" && shouldShowQnaSection && (
          <>
            {/* QnA status banner */}
            <StatusBanner
              jobId={qnaJobId}
              status={qnaJobStatus}
              docLogs={qnaDocLogs}
              configFn={getQnaStatusConfig}
              onClose={() => { setQnaJobStatus(null); setQnaDocLogs(""); setIsQnaSubmitted(false); }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                alignItems: "start",
              }}
            >
              {/* Left: Upload zone */}
              <SectionCard title="Upload QnA CSV" accent="#3b82f6">
                <Box
                  sx={{
                    border: "2px dashed",
                    borderColor: qnaFileBlob ? "#10b981" : "#93c5fd",
                    borderRadius: "12px",
                    p: 3,
                    textAlign: "center",
                    bgcolor: qnaFileBlob ? "#f0fdf4" : "#eff6ff",
                    transition: "all 0.2s",
                    minHeight: 200,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!qnaFileBlob ? (
                    <>
                      <QuestionAnswer sx={{ fontSize: 40, color: "#93c5fd", mb: 1.5 }} />
                      <Typography sx={{ fontSize: 14, color: "#4b5563", mb: 0.5 }}>
                        Upload a QnA CSV file
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#9ca3af", mb: 2 }}>
                        Only CSV files are supported
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "center" }}>
                        <Button
                          variant="contained" onClick={triggerQnaFileSelect} size="small"
                          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                        >
                          Browse CSV Files
                        </Button>
                        <Button
                          variant="outlined" size="small" onClick={handleDownloadSample}
                          sx={{ borderRadius: "8px", textTransform: "none" }}
                        >
                          Download Sample
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Box>
                      <CheckCircle sx={{ fontSize: 32, color: "#10b981", mb: 1 }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#065f46", mb: 0.5 }}>
                        {qnaFileName}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: "#9ca3af", mb: 2 }}>
                        CSV file ready to submit
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center" }}>
                        <Button
                          variant="outlined" size="small" onClick={removeQnaFile} color="error"
                          sx={{ borderRadius: "8px", textTransform: "none" }}
                        >
                          Remove
                        </Button>
                        <Button
                          variant="contained" size="small" onClick={handleQnaSubmit}
                          disabled={isQnaUploading || isQnaSubmitted || !docId}
                          sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 600 }}
                        >
                          {isQnaUploading && <CircularProgress size={14} sx={{ mr: 1 }} />}
                          Submit QnA
                        </Button>
                      </Box>
                      {!docId && (
                        <Typography sx={{ fontSize: 12, color: "#f59e0b", mt: 1.5 }}>
                          Please submit the main document first
                        </Typography>
                      )}
                    </Box>
                  )}
                  <input type="file" accept=".csv" ref={qnaFileInputRef} onChange={handleQnaFileSelect} style={{ display: "none" }} />
                </Box>
              </SectionCard>

              {/* Right: Info + status */}
              <Box>
                <SectionCard title="Document Context" accent="#3b82f6">
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {[
                      { label: "Knowledge Base", value: selectedCollection?.name },
                      { label: "Category", value: selectedCategory?.name },
                      { label: "Sub Category", value: selectedSubCategory?.name || "—" },
                      { label: "Document ID", value: docId || "Not yet submitted" },
                    ].map(({ label, value }) => (
                      <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography sx={{ fontSize: 12, color: "#6b7280" }}>{label}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: "#111827", maxWidth: "60%", textAlign: "right", wordBreak: "break-all" }}>
                          {value || "—"}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </SectionCard>

                {qnaJobId && (
                  <SectionCard title="QnA Job Status" accent="#3b82f6">
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Job ID</Typography>
                      <Typography sx={{ fontSize: 12, fontFamily: "monospace", color: "#111827" }}>{qnaJobId}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography sx={{ fontSize: 12, color: "#6b7280" }}>Status</Typography>
                      <Chip
                        label={qnaJobStatus || "pending"}
                        size="small"
                        sx={{
                          fontSize: 11, fontWeight: 600, borderRadius: "6px",
                          bgcolor:
                            qnaJobStatus === "ended" ? "#d1fae5" :
                            qnaJobStatus === "failed" ? "#fee2e2" :
                            qnaJobStatus === "running" ? "#dbeafe" : "#fef3c7",
                          color:
                            qnaJobStatus === "ended" ? "#065f46" :
                            qnaJobStatus === "failed" ? "#991b1b" :
                            qnaJobStatus === "running" ? "#1e40af" : "#92400e",
                        }}
                      />
                    </Box>
                  </SectionCard>
                )}

                <Box
                  sx={{
                    p: 2, bgcolor: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: "10px", mt: 1,
                  }}
                >
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#92400e", mb: 0.5 }}>
                    CSV Format Guide
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "#78350f" }}>
                    Your CSV should contain <strong>question</strong> and <strong>answer</strong> columns.
                    Download the sample file to see the expected format.
                  </Typography>
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </>
  );
}

export default FileUpload;
