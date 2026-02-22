import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
  ArrowLeft, 
  History as HistoryIcon, 
  Search, 
  Zap, 
  LayoutGrid, 
  Network, 
  Plus, 
  Share2, 
  X, 
  Clock, 
  CheckCircle2, 
  Bold, 
  Italic, 
  Type, 
  FileText, 
  Trash, 
  Copy, 
  Trash2, 
  Sparkles, 
  Loader2,
  MoreHorizontal,
  Group,
  Ungroup,
  MousePointer2,
  Save,
  Layers,
  Users,
  Link as LinkIcon,
  MessageSquare,
  UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type as GenAIType } from "@google/genai";
import { cn } from '../lib/utils';
import type { Map, Node } from '../types';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ExportMapModal } from '../components/ExportMapModal';

export const MindMapEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [map, setMap] = useState<Map | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<'content' | 'settings'>('content');
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number, y: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [timerSeconds, setTimerSeconds] = useState(1500);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'new' | 'review' | 'mastered'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleExportMap = async (format: 'pdf' | 'png' | 'jpeg', quality: number, options: { includeNotes: boolean; masteryIcons: boolean; autoScale: boolean }) => {
    if (!canvasRef.current || nodes.length === 0) return;

    try {
      // 1. Calculate bounding box of all nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + 200); // Approximate node width
        maxY = Math.max(maxY, node.y + 150); // Approximate node height
      });

      // Add padding
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const width = maxX - minX;
      const height = maxY - minY;

      // 2. Create a temporary container for export
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.top = '-9999px';
      exportContainer.style.left = '-9999px';
      exportContainer.style.width = `${width}px`;
      exportContainer.style.height = `${height}px`;
      // Use a specific background color to ensure it's not transparent
      exportContainer.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc';
      exportContainer.style.overflow = 'hidden';
      
      // 3. Clone the canvas content
      // We can't just clone the DOM because React state/events won't be attached, 
      // but for a static screenshot, visual DOM cloning is usually enough.
      // However, canvasRef contains the transform wrapper. We want the inner content without the current pan/zoom.
      
      // Let's manually reconstruct the visual representation for the export to ensure it's clean
      // This is more robust than cloning the live, transformed DOM.
      
      // Create SVG layer for connections
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.style.position = "absolute";
      svg.style.top = "0";
      svg.style.left = "0";
      svg.style.zIndex = "0";

      nodes.forEach(node => {
        if (!node.parent_id) return;
        const parent = nodes.find(n => n.id === node.parent_id);
        if (!parent) return;

        // Calculate positions relative to the export container (shifting by minX, minY)
        const startX = (parent.x - minX) + (200/2); // Center of parent (approx width 200)
        const startY = (parent.y - minY) + (100/2); // Center of parent (approx height 100)
        const endX = (node.x - minX) + (200/2);
        const endY = (node.y - minY) + (100/2);

        const path = document.createElementNS(svgNS, "path");
        const d = `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`;
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#cbd5e1"); // slate-300
        path.setAttribute("stroke-width", "2");
        svg.appendChild(path);
      });
      exportContainer.appendChild(svg);

      // Create Nodes
      nodes.forEach(node => {
        const nodeEl = document.createElement('div');
        nodeEl.style.position = 'absolute';
        nodeEl.style.left = `${node.x - minX}px`;
        nodeEl.style.top = `${node.y - minY}px`;
        nodeEl.style.width = 'auto'; // Let it size naturally like in the app
        nodeEl.style.minWidth = '160px';
        nodeEl.style.maxWidth = '240px';
        nodeEl.style.zIndex = '10';
        nodeEl.style.backgroundColor = document.documentElement.classList.contains('dark') ? '#1e293b' : '#ffffff';
        nodeEl.style.border = `2px solid ${node.mastery_level === 100 ? '#22c55e' : (node.color || '#e2e8f0')}`;
        nodeEl.style.borderRadius = node.shape === 'circle' ? '9999px' : '0.75rem'; // rounded-xl
        nodeEl.style.padding = '1rem 1.5rem';
        nodeEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        nodeEl.style.display = 'flex';
        nodeEl.style.flexDirection = 'column';
        nodeEl.style.alignItems = 'center';
        nodeEl.style.textAlign = 'center';

        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = node.title;
        titleEl.style.fontSize = node.fontSize ? `${node.fontSize}px` : '14px';
        titleEl.style.fontWeight = node.isBold ? 'bold' : 'normal';
        titleEl.style.fontStyle = node.isItalic ? 'italic' : 'normal';
        titleEl.style.color = node.textColor || (document.documentElement.classList.contains('dark') ? '#ffffff' : '#0f172a');
        titleEl.style.marginBottom = '4px';
        nodeEl.appendChild(titleEl);

        // Notes (if enabled)
        if (options.includeNotes && node.notes) {
          const notesEl = document.createElement('p');
          notesEl.textContent = node.notes;
          notesEl.style.fontSize = '10px';
          notesEl.style.color = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
          nodeEl.appendChild(notesEl);
        }

        // Mastery Icon (if enabled)
        if (options.masteryIcons && node.mastery_level === 100) {
           const iconEl = document.createElement('div');
           iconEl.textContent = "✓ Mastered";
           iconEl.style.color = "#16a34a";
           iconEl.style.fontSize = "10px";
           iconEl.style.fontWeight = "bold";
           iconEl.style.marginTop = "4px";
           nodeEl.appendChild(iconEl);
        }

        exportContainer.appendChild(nodeEl);
      });

      document.body.appendChild(exportContainer);

      // 4. Capture with html2canvas
      const scale = quality === 1 ? 1 : quality === 2 ? 2 : 3;
      const canvas = await html2canvas(exportContainer, {
        scale: scale,
        useCORS: true,
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
        logging: false,
      });

      // 5. Clean up
      document.body.removeChild(exportContainer);

      // 6. Download
      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, width, height);
        pdf.save(`${map?.title || 'mind-map'}.pdf`);
      } else {
        const link = document.createElement('a');
        link.download = `${map?.title || 'mind-map'}.${format}`;
        link.href = canvas.toDataURL(`image/${format}`, quality === 3 ? 1.0 : 0.8);
        link.click();
      }

    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export map. Please try again.");
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoom(1);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMasteryChange = async (level: number) => {
    if (!selectedNode) return;
    
    const updatedNode = { ...selectedNode, mastery_level: level };
    
    // Update local state immediately for responsiveness
    setSelectedNode(updatedNode);
    setNodes(prev => prev.map(n => n.id === selectedNode.id ? updatedNode : n));
    
    // Persist to backend
    try {
      await fetch(`/api/nodes/${selectedNode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mastery_level: level })
      });
    } catch (error) {
      console.error("Failed to update mastery level:", error);
    }
  };

  const summarizeNotes = async () => {
    if (!selectedNode || !selectedNode.notes) return;

    setIsSummarizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize the following notes into a concise paragraph (max 3 sentences):
        
        "${selectedNode.notes}"`,
        config: {
          responseMimeType: "text/plain",
        }
      });

      const summary = response.text;
      if (summary) {
        setSelectedNode(prev => prev ? { ...prev, notes: summary } : null);
      }
    } catch (error) {
      console.error("Summarization failed:", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const generateAINode = async () => {
    if (!selectedNode || !map) return;
    
    setIsGeneratingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on the current mind map node titled "${selectedNode.title}" with notes "${selectedNode.notes}", suggest a relevant child node. 
        Return a JSON object with "title" and "notes" fields. The notes should be a brief explanation (max 2 sentences).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.OBJECT,
            properties: {
              title: { type: GenAIType.STRING },
              notes: { type: GenAIType.STRING }
            },
            required: ["title", "notes"]
          }
        }
      });

      const suggestion = JSON.parse(response.text);
      
      const newNodeData = {
        map_id: map.id,
        parent_id: selectedNode.id,
        title: suggestion.title,
        notes: suggestion.notes,
        color: selectedNode.color,
        x: selectedNode.x + 250,
        y: selectedNode.y + (Math.random() * 200 - 100),
        shape: selectedNode.shape
      };

      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNodeData)
      });

      if (res.ok) {
        const newNode = await res.json();
        setNodes(prev => [...prev, newNode]);
        setSelectedNode(newNode);
        setPan({ x: -newNode.x, y: -newNode.y });
        setIsToolbarOpen(false);
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateMultipleSubtopics = async () => {
    if (!selectedNode || !map) return;
    
    setIsGeneratingAI(true);
    try {
      // Gather context from ancestors
      const ancestors: Node[] = [];
      let currentParentId = selectedNode.parent_id;
      while (currentParentId) {
        const parent = nodes.find(n => n.id === currentParentId);
        if (parent) {
          ancestors.unshift(parent);
          currentParentId = parent.parent_id;
        } else {
          break;
        }
      }

      const context = ancestors.map(a => `Topic: ${a.title} (${a.notes})`).join(' -> ');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${context} -> Current Node: ${selectedNode.title} (${selectedNode.notes})
        Suggest 3-5 relevant sub-topics (child nodes) for the current node. 
        Return a JSON array of objects, each with "title" and "notes" fields.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.ARRAY,
            items: {
              type: GenAIType.OBJECT,
              properties: {
                title: { type: GenAIType.STRING },
                notes: { type: GenAIType.STRING }
              },
              required: ["title", "notes"]
            }
          }
        }
      });

      const suggestions = JSON.parse(response.text);
      
      const newNodes = await Promise.all(suggestions.map(async (suggestion: any, index: number) => {
        const newNodeData = {
          map_id: map.id,
          parent_id: selectedNode.id,
          title: suggestion.title,
          notes: suggestion.notes,
          color: selectedNode.color,
          x: selectedNode.x + 300,
          y: selectedNode.y + (index - (suggestions.length - 1) / 2) * 150,
          shape: selectedNode.shape
        };

        const res = await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newNodeData)
        });
        return res.ok ? res.json() : null;
      }));

      const successfulNodes = newNodes.filter(n => n !== null);
      setNodes(prev => [...prev, ...successfulNodes]);
      setIsToolbarOpen(false);
    } catch (error) {
      console.error("AI Multiple Generation failed:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const addSiblingNode = async () => {
    if (!selectedNode || !map || !selectedNode.parent_id) return;
    
    const newNodeData = {
      map_id: map.id,
      parent_id: selectedNode.parent_id,
      title: "New Sibling",
      notes: "",
      color: selectedNode.color,
      x: selectedNode.x,
      y: selectedNode.y + 150,
      shape: selectedNode.shape
    };

    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNodeData)
    });

    if (res.ok) {
      const newNode = await res.json();
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(newNode);
      setPan({ x: -newNode.x, y: -newNode.y });
      setIsToolbarOpen(false);
    }
  };

  const addChildNode = async () => {
    if (!selectedNode || !map) return;
    
    const newNodeData = {
      map_id: map.id,
      parent_id: selectedNode.id,
      title: "New Child",
      notes: "",
      color: selectedNode.color,
      x: selectedNode.x + 250,
      y: selectedNode.y,
      shape: selectedNode.shape
    };

    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNodeData)
    });

    if (res.ok) {
      const newNode = await res.json();
      setNodes(prev => [...prev, newNode]);
      setSelectedNode(newNode);
      setPan({ x: -newNode.x, y: -newNode.y });
      setIsToolbarOpen(false);
    }
  };

  const filteredNodes = searchQuery.trim() === '' 
    ? [] 
    : nodes.filter(node => 
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        node.notes.toLowerCase().includes(searchQuery.toLowerCase())
      );

  useEffect(() => {
    fetch(`/api/maps/${id}`).then(res => res.json()).then(data => {
      setMap(data);
      setNodes(data.nodes);
    });
  }, [id]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleNodeClick = (e: React.MouseEvent, node: Node) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedNodeIds(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id) 
          : [...prev, node.id]
      );
      setSelectedNode(null);
    } else {
      setSelectedNode(node);
      setSelectedNodeIds([node.id]);
      setIsPanelOpen(true);
    }
  };

  const handleGroupNodes = async () => {
    if (selectedNodeIds.length < 2) return;
    
    const groupId = `group_${Math.random().toString(36).substr(2, 9)}`;
    
    // Optimistic update
    setNodes(prev => prev.map(n => 
      selectedNodeIds.includes(n.id) ? { ...n, group_id: groupId } : n
    ));

    try {
      await Promise.all(selectedNodeIds.map(nodeId => 
        fetch(`/api/nodes/${nodeId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: groupId })
        })
      ));
    } catch (error) {
      console.error("Failed to group nodes:", error);
    }
  };

  const handleUngroupNodes = async () => {
    const nodesToUngroup = nodes.filter(n => 
      selectedNodeIds.includes(n.id) && n.group_id
    );
    
    if (nodesToUngroup.length === 0) return;
    
    const groupIds = Array.from(new Set(nodesToUngroup.map(n => n.group_id)));
    
    // Optimistic update
    setNodes(prev => prev.map(n => 
      n.group_id && groupIds.includes(n.group_id) ? { ...n, group_id: null } : n
    ));

    try {
      const allNodesInGroups = nodes.filter(n => n.group_id && groupIds.includes(n.group_id));
      await Promise.all(allNodesInGroups.map(node => 
        fetch(`/api/nodes/${node.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: null })
        })
      ));
    } catch (error) {
      console.error("Failed to ungroup nodes:", error);
    }
  };

  const handleSaveMap = async () => {
    setIsSaving(true);
    try {
      // Save current selected node if any
      if (selectedNode) {
        await fetch(`/api/nodes/${selectedNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selectedNode)
        });
      }
      // In a more complex app, we'd track "dirty" nodes and save them all here.
      // For this implementation, we'll simulate a full save.
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      console.error("Failed to save map:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNode = async () => {
    const nodesToDelete = selectedNodeIds.length > 0 
      ? selectedNodeIds 
      : selectedNode ? [selectedNode.id] : [];
    
    if (nodesToDelete.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${nodesToDelete.length} node(s) and their connections?`)) {
      try {
        // Optimistic update
        const getDescendantIds = (parentIds: string[], allNodes: Node[]): string[] => {
          const children = allNodes.filter(n => n.parent_id && parentIds.includes(n.parent_id));
          if (children.length === 0) return [];
          const childIds = children.map(c => c.id);
          return [...childIds, ...getDescendantIds(childIds, allNodes)];
        };
        
        const allIdsToDelete = [...nodesToDelete, ...getDescendantIds(nodesToDelete, nodes)];
        setNodes(prev => prev.filter(n => !allIdsToDelete.includes(n.id)));
        setSelectedNode(null);
        setSelectedNodeIds([]);

        // Send delete requests
        await Promise.all(nodesToDelete.map(id => 
          fetch(`/api/nodes/${id}`, { method: 'DELETE' })
        ));
      } catch (error) {
        console.error("Failed to delete nodes:", error);
        // In a real app, we might want to revert the state here or refetch
      }
    }
  };

  const handleDuplicateNode = async () => {
    if (!selectedNode || !map) return;
    
    const newNodeData = {
      map_id: map.id,
      parent_id: selectedNode.parent_id,
      title: `${selectedNode.title} (Copy)`,
      notes: selectedNode.notes,
      color: selectedNode.color,
      x: selectedNode.x + 30,
      y: selectedNode.y + 30,
      shape: selectedNode.shape,
      fontSize: selectedNode.fontSize,
      textColor: selectedNode.textColor,
      isBold: selectedNode.isBold,
      isItalic: selectedNode.isItalic
    };

    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNodeData)
      });

      if (res.ok) {
        const newNode = await res.json();
        setNodes(prev => [...prev, newNode]);
        setSelectedNode(newNode);
        setSelectedNodeIds([newNode.id]);
      }
    } catch (error) {
      console.error("Failed to duplicate node:", error);
    }
  };

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  const handleConnectionStart = (e: React.MouseEvent | React.TouchEvent, nodeId: string) => {
    e.stopPropagation();
    // Prevent default only for mouse events to avoid blocking scrolling on touch if needed, 
    // but here we want to drag, so preventing default is usually good for drag.
    // However, for touch, we might need to be careful.
    // Let's prevent default to stop scrolling while dragging the connection.
    if (e.cancelable) e.preventDefault();
    
    setConnectingNodeId(nodeId);
    
    // Calculate initial position relative to canvas center
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      // Adjust for zoom: (screen_coord - offset) / zoom
      const x = (clientX - rect.left - pan.x - centerX) / zoom;
      const y = (clientY - rect.top - pan.y - centerY) / zoom;
      setTempConnectionEnd({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x - centerX) / zoom;
      const y = (e.clientY - rect.top - pan.y - centerY) / zoom;
      setTempConnectionEnd({ x, y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (connectingNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.touches[0].clientX - rect.left - pan.x - centerX) / zoom;
      const y = (e.touches[0].clientY - rect.top - pan.y - centerY) / zoom;
      setTempConnectionEnd({ x, y });
    }
  };

  const handleGlobalMouseUp = () => {
    if (connectingNodeId) {
      setConnectingNodeId(null);
      setTempConnectionEnd(null);
    }
  };

  const handleGlobalTouchEnd = (e: React.TouchEvent) => {
    if (connectingNodeId) {
      // Check if we dropped on a node
      // We need to find if the touch end coordinates are within any node's bounds
      const touch = e.changedTouches[0];
      const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // Find the closest node element
      const nodeElement = targetElement?.closest('[data-node-id]');
      if (nodeElement) {
        const targetNodeId = nodeElement.getAttribute('data-node-id');
        const targetNode = nodes.find(n => n.id === targetNodeId);
        if (targetNode) {
          handleNodeConnectionComplete(targetNode);
          return;
        }
      }

      setConnectingNodeId(null);
      setTempConnectionEnd(null);
    }
  };

  const handleNodeConnectionComplete = async (targetNode: Node) => {
    if (connectingNodeId && connectingNodeId !== targetNode.id) {
      // Update parent_id of targetNode to connect to connectingNodeId
      // Note: This creates a parent-child relationship where connectingNode is the parent
      
      // Prevent cycles (simple check: target cannot be parent of source)
      // A full cycle check would be better but this is a basic safeguard
      if (targetNode.parent_id === connectingNodeId) {
         setConnectingNodeId(null);
         setTempConnectionEnd(null);
         return;
      }

      const updatedNode = { ...targetNode, parent_id: connectingNodeId };
      
      // Optimistic update
      setNodes(prev => prev.map(n => n.id === targetNode.id ? updatedNode : n));

      try {
        await fetch(`/api/nodes/${targetNode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent_id: connectingNodeId })
        });
      } catch (error) {
        console.error("Failed to update connection:", error);
        // Revert on failure
        setNodes(prev => prev.map(n => n.id === targetNode.id ? targetNode : n));
      }
    }
    setConnectingNodeId(null);
    setTempConnectionEnd(null);
  };

  const handleNodeMouseUp = (e: React.MouseEvent, targetNode: Node) => {
    e.stopPropagation();
    handleNodeConnectionComplete(targetNode);
  };

  return (
    <div 
      className="flex flex-col h-screen overflow-hidden bg-app font-display text-slate-900 dark:text-slate-100 transition-colors duration-300"
      onMouseUp={handleGlobalMouseUp}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleGlobalTouchEnd}
    >
      {/* Top Toolbar */}
      <header className="z-20 flex items-center justify-between bg-surface/90 backdrop-blur-sm px-2 sm:px-4 py-2 sm:py-3 border-b border-slate-200 dark:border-slate-800 shadow-sm shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300">
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate max-w-[100px] sm:max-w-xs">{map?.title || 'Loading...'}</h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center gap-1">
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Undo">
              <HistoryIcon size={20} />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" title="Redo">
              <div className="rotate-180 scale-x-[-1]"><HistoryIcon size={20} /></div>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
          </div>
          
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={cn("p-1.5 sm:p-2 rounded-lg transition-colors", isSearchOpen ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300")} 
            title="Search"
          >
            <Search size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <button 
            onClick={() => {
              if (selectedNodeIds.length > 0) {
                setSelectedNodeIds([]);
                setSelectedNode(null);
              }
            }}
            className={cn(
              "p-1.5 sm:p-2 rounded-lg transition-colors", 
              selectedNodeIds.length > 1 ? "bg-primary text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            )} 
            title="Multi-Selection Mode (Shift+Click)"
          >
            <MousePointer2 size={20} className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <button className="hidden sm:block p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary dark:text-primary" title="Auto-Layout">
            <Zap size={20} />
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 sm:p-1 gap-0.5 sm:gap-1">
            <button onClick={handleZoomOut} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Zoom Out">
              <span className="text-xs sm:text-sm font-bold px-1">-</span>
            </button>
            <button onClick={handleZoomReset} className="text-[10px] sm:text-xs font-mono font-medium w-8 sm:w-10 text-center text-slate-600 dark:text-slate-300" title="Reset Zoom">
              {Math.round(zoom * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300" title="Zoom In">
              <span className="text-xs sm:text-sm font-bold px-1">+</span>
            </button>
          </div>
          
          <button className="hidden sm:flex ml-1 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors items-center gap-1">
            <LayoutGrid size={16} />
            <span className="hidden sm:inline">Focus</span>
          </button>

          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors" 
            title="Export Mind Map"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={handleSaveMap}
            disabled={isSaving}
            className={cn(
              "ml-1 px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 shadow-sm",
              isSaving 
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                : "bg-primary text-white hover:bg-blue-600 active:scale-95"
            )}
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Map'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <main ref={containerRef} className="relative flex-1 w-full h-full overflow-hidden">
        {/* Search Bar Overlay */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            >
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center px-4 py-3 gap-3 border-b border-slate-100 dark:border-slate-800">
                  <Search size={20} className="text-slate-400" />
                  <input 
                    autoFocus
                    placeholder="Search nodes by title or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200"
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                {filteredNodes.length > 0 && (
                  <div className="max-h-60 overflow-y-auto no-scrollbar">
                    {filteredNodes.map(node => (
                      <button
                        key={node.id}
                        onClick={() => {
                          setSelectedNode(node);
                          setIsPanelOpen(true);
                          setPan({ x: -node.x * zoom, y: -node.y * zoom });
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-none"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{node.title}</p>
                        <p className="text-xs text-slate-500 truncate">{node.notes || 'No notes'}</p>
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery && filteredNodes.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-slate-500">No matching nodes found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Infinite Canvas Background */}
        <motion.div 
          drag
          dragMomentum={false}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0}
          onDrag={(_, info) => setPan(prev => ({ x: prev.x + info.delta.x, y: prev.y + info.delta.y }))}
          className="absolute inset-0 bg-background-light dark:bg-background-dark bg-dots z-0 cursor-grab active:cursor-grabbing"
          style={{ backgroundPosition: `${pan.x}px ${pan.y}px`, backgroundSize: `${20 * zoom}px ${20 * zoom}px` }}
        >
          {/* Simulated Mind Map Content */}
          <div 
            ref={canvasRef}
            className="absolute inset-0 transform origin-center"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            {/* Connections (SVG Layer) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ zIndex: 0 }}>
              {nodes.map(node => {
                if (!node.parent_id) return null;
                const parent = nodes.find(n => n.id === node.parent_id);
                if (!parent) return null;
                
                const startX = parent.x + centerX;
                const startY = parent.y + centerY;
                const endX = node.x + centerX;
                const endY = node.y + centerY;
                
                return (
                  <path
                    key={`conn-${node.id}`}
                    d={`M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`}
                    fill="none"
                    stroke={selectedNode?.id === node.id ? "#137fec" : "#cbd5e1"}
                    strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                    className="dark:stroke-slate-700 transition-all"
                  />
                );
              })}
              {/* Temporary Connection Line */}
              {connectingNodeId && tempConnectionEnd && (
                (() => {
                  const sourceNode = nodes.find(n => n.id === connectingNodeId);
                  if (!sourceNode) return null;
                  const startX = sourceNode.x + centerX;
                  const startY = sourceNode.y + centerY;
                  const endX = tempConnectionEnd.x + centerX;
                  const endY = tempConnectionEnd.y + centerY;
                  return (
                    <path
                      d={`M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`}
                      fill="none"
                      stroke="#137fec"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                      className="transition-all"
                    />
                  );
                })()
              )}
            </svg>

            {/* Nodes */}
            {nodes.map(node => (
              <motion.div
                key={node.id}
                data-node-id={node.id}
                drag
                dragMomentum={false}
                onDrag={(e, info) => {
                  e.stopPropagation();
                  
                  const nodesToMove = node.group_id 
                    ? nodes.filter(n => n.group_id === node.group_id)
                    : selectedNodeIds.includes(node.id) && selectedNodeIds.length > 1
                      ? nodes.filter(n => selectedNodeIds.includes(n.id))
                      : [node];

                  setNodes(prev => prev.map(n => {
                    const target = nodesToMove.find(m => m.id === n.id);
                    if (target) {
                      return { ...n, x: n.x + info.delta.x, y: n.y + info.delta.y };
                    }
                    return n;
                  }));

                  if (selectedNode && nodesToMove.some(n => n.id === selectedNode.id)) {
                    const target = nodesToMove.find(n => n.id === selectedNode.id);
                    if (target) {
                      setSelectedNode(prev => prev ? { ...prev, x: prev.x + info.delta.x, y: prev.y + info.delta.y } : null);
                    }
                  }
                }}
                onDragEnd={() => {
                  const nodesToMove = node.group_id 
                    ? nodes.filter(n => n.group_id === node.group_id)
                    : selectedNodeIds.includes(node.id) && selectedNodeIds.length > 1
                      ? nodes.filter(n => selectedNodeIds.includes(n.id))
                      : [node];

                  nodesToMove.forEach(n => {
                    fetch(`/api/nodes/${n.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ x: n.x, y: n.y })
                    });
                  });
                }}
                initial={false}
                animate={{ x: node.x + centerX, y: node.y + centerY }}
                onClick={(e) => handleNodeClick(e, node)}
                onMouseUp={(e) => handleNodeMouseUp(e, node)}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-shadow z-10",
                  (selectedNode?.id === node.id || selectedNodeIds.includes(node.id)) ? "ring-4 ring-primary/20 rounded-xl" : "",
                  node.group_id ? "ring-2 ring-dashed ring-slate-300 dark:ring-slate-600 rounded-xl p-1" : "",
                  searchQuery && (node.title.toLowerCase().includes(searchQuery.toLowerCase()) || node.notes.toLowerCase().includes(searchQuery.toLowerCase())) ? "ring-4 ring-yellow-400/50 scale-110 z-20" : ""
                )}
              >
                {/* Quick Delete Button on Node */}
                {selectedNode?.id === node.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNode();
                    }}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full border-2 border-white shadow-sm flex items-center justify-center hover:bg-red-600 transition-colors z-30"
                    title="Delete Node"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                <div 
                  className={cn(
                    "bg-white dark:bg-slate-800 border-2 shadow-lg px-6 py-4 min-w-[160px] text-center transition-all",
                    node.shape === 'circle' ? "rounded-full" : "rounded-xl",
                    selectedNode?.id === node.id ? "border-primary" : "border-slate-200 dark:border-slate-700",
                    node.mastery_level === 100 ? "border-green-500" : ""
                  )}
                  style={{ borderColor: selectedNode?.id === node.id ? undefined : (node.mastery_level === 100 ? '#22c55e' : node.color) }}
                >
                  <div className="flex flex-col items-center">
                    <h2 
                      className={cn(
                        "text-slate-900 dark:text-white transition-all",
                        node.isBold ? "font-bold" : "font-normal",
                        node.isItalic ? "italic" : "",
                        selectedNode?.id === node.id ? "text-lg mb-1" : "text-sm"
                      )}
                      style={{ 
                        fontSize: node.fontSize && selectedNode?.id !== node.id ? `${node.fontSize}px` : undefined,
                        color: node.textColor || undefined 
                      }}
                    >
                      {node.title}
                    </h2>
                    <p 
                      className={cn(
                        "text-slate-500 dark:text-slate-400 font-medium transition-all",
                        selectedNode?.id === node.id ? "text-xs max-w-[200px]" : "text-[10px] truncate max-w-[120px]"
                      )}
                      style={{ color: node.textColor ? `${node.textColor}cc` : undefined }}
                    >
                      {node.notes 
                        ? (selectedNode?.id === node.id ? node.notes : node.notes.substring(0, 20) + '...') 
                        : 'No notes'}
                    </p>
                  </div>
                  
                  {node.mastery_level < 100 && node.mastery_level > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={12} className="text-orange-500" />
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Review Due</span>
                    </div>
                  )}
                  {node.mastery_level === 100 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <CheckCircle2 size={12} className="text-green-500" />
                      <span className="text-[8px] text-green-600 uppercase font-bold tracking-wider">Mastered</span>
                    </div>
                  )}
                </div>
                {/* Connector dots for dragging simulation */}
                {selectedNode?.id === node.id && (
                  <div 
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-primary rounded-full border-2 border-white cursor-crosshair hover:scale-110 transition-transform z-20 shadow-sm flex items-center justify-center"
                    onMouseDown={(e) => handleConnectionStart(e, node.id)}
                    onTouchStart={(e) => handleConnectionStart(e, node.id)}
                  >
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
        {/* Mini-Map (Bottom Left) */}
        <div className="absolute bottom-20 left-4 z-20 w-32 h-24 bg-white/90 dark:bg-slate-800/90 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden hidden sm:block">
          <div className="relative w-full h-full bg-slate-50 dark:bg-slate-900 p-1 opacity-50">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-slate-400 rounded-full"></div>
            <div className="absolute top-[30%] left-[70%] w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <div className="absolute top-[70%] left-[70%] w-1.5 h-1.5 bg-primary rounded-sm"></div>
            <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-primary/50 bg-primary/10 rounded-sm"></div>
          </div>
        </div>

        {/* Floating Quick-Action Toolbar */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-30">
          <AnimatePresence mode="wait">
            {isToolbarOpen ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-xl border border-slate-100 dark:border-slate-700"
              >
                <button 
                  onClick={addSiblingNode}
                  disabled={!selectedNode || !selectedNode.parent_id}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Add Sibling"
                >
                  <Network size={20} />
                </button>
                <button 
                  onClick={addChildNode}
                  disabled={!selectedNode}
                  className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
                  title="Add Child Node"
                >
                  <Plus size={28} />
                </button>
                <button 
                  disabled={!selectedNode}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Attach Media"
                >
                  <Share2 size={20} />
                </button>
                <button 
                  onClick={generateAINode}
                  disabled={!selectedNode || isGeneratingAI}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Generate with AI"
                >
                  {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                </button>
                <button 
                  onClick={generateMultipleSubtopics}
                  disabled={!selectedNode || isGeneratingAI}
                  className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  title="Generate Multiple Sub-topics"
                >
                  {isGeneratingAI ? <Loader2 size={20} className="animate-spin" /> : <Layers size={20} />}
                </button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button 
                  onClick={() => setIsToolbarOpen(false)}
                  className="flex flex-col items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  title="Hide Toolbar"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={() => setIsToolbarOpen(true)}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                title="Show Toolbar"
              >
                <MoreHorizontal size={24} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Collapsible Node Properties Side Panel */}
        <AnimatePresence>
          {(selectedNode || selectedNodeIds.length > 1) && isPanelOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="absolute top-4 right-4 bottom-24 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-40 flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                  {selectedNodeIds.length > 1 ? `${selectedNodeIds.length} Nodes Selected` : 'Node Properties'}
                </h3>
                <button onClick={() => setIsPanelOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X size={20} />
                </button>
              </div>
              
              {selectedNode && selectedNodeIds.length <= 1 && (
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={() => setActivePanelTab('content')}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold transition-all border-b-2",
                      activePanelTab === 'content' ? "border-primary text-primary" : "border-transparent text-slate-400"
                    )}
                  >
                    Content
                  </button>
                  <button 
                    onClick={() => setActivePanelTab('settings')}
                    className={cn(
                      "flex-1 py-2 text-xs font-bold transition-all border-b-2",
                      activePanelTab === 'settings' ? "border-primary text-primary" : "border-transparent text-slate-400"
                    )}
                  >
                    Settings
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                {/* Group Actions */}
                {selectedNodeIds.length > 1 && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Group Actions</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleGroupNodes}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-600 transition-colors"
                      >
                        <Group size={14} />
                        Group
                      </button>
                      <button 
                        onClick={handleUngroupNodes}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Ungroup size={14} />
                        Ungroup
                      </button>
                    </div>
                  </div>
                )}

                {selectedNode && (
                  <>
                  {activePanelTab === 'content' ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Title</label>
                        <input 
                          value={selectedNode.title}
                          onChange={(e) => setSelectedNode({ ...selectedNode, title: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Notes</label>
                          <button 
                            onClick={summarizeNotes}
                            disabled={isSummarizing || !selectedNode.notes}
                            className="text-[10px] font-bold text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                          >
                            {isSummarizing ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                            Summarize with AI
                          </button>
                        </div>
                        <textarea 
                          value={selectedNode.notes}
                          onChange={(e) => setSelectedNode({ ...selectedNode, notes: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm h-48 resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                          placeholder="Type notes for this node..."
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Attachments</label>
                          <button className="text-primary hover:text-primary/80 transition-colors">
                            <Plus size={16} />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 group">
                            <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                              <FileText size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">summary_notes.pdf</p>
                              <p className="text-[10px] text-slate-400">1.2 MB</p>
                            </div>
                            <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all">
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Style Section */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Style</label>
                        <div className="grid grid-cols-5 gap-2">
                          {['#ffffff', '#fef3c7', '#dbeafe', '#dcfce7', '#fee2e2'].map(color => (
                            <button 
                              key={color}
                              onClick={() => setSelectedNode({ ...selectedNode, color })}
                              className={cn(
                                "w-8 h-8 rounded-full border shadow-sm transition-all",
                                selectedNode.color === color ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900 scale-110" : "border-slate-300"
                              )}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                          <button 
                            onClick={() => setSelectedNode({ ...selectedNode, shape: 'rounded' })}
                            className={cn("flex-1 py-2 border rounded flex justify-center items-center transition-colors", selectedNode.shape === 'rounded' ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600")}
                          >
                            <div className="w-4 h-3 border-2 border-current rounded-sm" />
                          </button>
                          <button 
                            onClick={() => setSelectedNode({ ...selectedNode, shape: 'circle' })}
                            className={cn("flex-1 py-2 border rounded flex justify-center items-center transition-colors", selectedNode.shape === 'circle' ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600")}
                          >
                            <div className="w-4 h-4 border-2 border-current rounded-full" />
                          </button>
                        </div>
                      </div>

                      {/* Typography Section */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Typography</label>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedNode({ ...selectedNode, isBold: !selectedNode.isBold })}
                            className={cn("p-2 rounded border transition-colors", selectedNode.isBold ? "bg-primary/10 border-primary text-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600")}
                            title="Bold"
                          >
                            <Bold size={16} />
                          </button>
                          <button 
                            onClick={() => setSelectedNode({ ...selectedNode, isItalic: !selectedNode.isItalic })}
                            className={cn("p-2 rounded border transition-colors", selectedNode.isItalic ? "bg-primary/10 border-primary text-primary" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600")}
                            title="Italic"
                          >
                            <Italic size={16} />
                          </button>
                          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                            <Type size={14} className="text-slate-400" />
                            <input 
                              type="range" 
                              min="12" 
                              max="32" 
                              value={selectedNode.fontSize || 14}
                              onChange={(e) => setSelectedNode({ ...selectedNode, fontSize: parseInt(e.target.value) })}
                              className="flex-1 accent-primary h-1"
                            />
                            <span className="text-[10px] font-bold text-slate-500 w-4">{selectedNode.fontSize || 14}</span>
                          </div>
                        </div>
                        
                        {/* Text Color Picker */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium">Text Color:</span>
                          <div className="flex gap-1">
                            {['#0f172a', '#334155', '#dc2626', '#16a34a', '#2563eb', '#9333ea'].map(color => (
                              <button
                                key={color}
                                onClick={() => setSelectedNode({ ...selectedNode, textColor: color })}
                                className={cn(
                                  "w-6 h-6 rounded-full border shadow-sm transition-all",
                                  (selectedNode.textColor || '#0f172a') === color ? "ring-2 ring-primary ring-offset-1 dark:ring-offset-slate-900 scale-110" : "border-slate-200"
                                )}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mastery Status</label>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          <button 
                            onClick={() => handleMasteryChange(0)}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                              selectedNode.mastery_level === 0
                                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" 
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                          >
                            New
                          </button>
                          <button 
                            onClick={() => handleMasteryChange(50)}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                              selectedNode.mastery_level > 0 && selectedNode.mastery_level < 100
                                ? "bg-white dark:bg-slate-700 text-orange-500 shadow-sm" 
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                          >
                            Review
                          </button>
                          <button 
                            onClick={() => handleMasteryChange(100)}
                            className={cn(
                              "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                              selectedNode.mastery_level === 100
                                ? "bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm" 
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                            )}
                          >
                            Mastered
                          </button>
                        </div>
                        <div className="flex items-center gap-3 px-1">
                          <span className="text-[10px] font-medium text-slate-400">0%</span>
                          <input 
                            type="range" 
                            value={selectedNode.mastery_level}
                            onChange={(e) => handleMasteryChange(parseInt(e.target.value))}
                            className="flex-1 accent-primary h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <span className="text-[10px] font-bold text-primary w-8 text-right">{selectedNode.mastery_level}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                {/* Quick Actions */}
                <div className="pt-4 space-y-2">
                  <button 
                    onClick={generateAINode}
                    disabled={isGeneratingAI}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isGeneratingAI ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
                    )}
                    {isGeneratingAI ? "AI is thinking..." : "Generate Child with AI"}
                  </button>
                  <button 
                    onClick={generateMultipleSubtopics}
                    disabled={isGeneratingAI}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isGeneratingAI ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Layers size={18} className="group-hover:scale-110 transition-transform" />
                    )}
                    {isGeneratingAI ? "AI is thinking..." : "Generate Sub-topics (3-5)"}
                  </button>
                  {selectedNode.group_id && (
                    <button 
                      onClick={handleUngroupNodes}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Ungroup size={16} />
                      Ungroup from Group
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleDuplicateNode}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Copy size={14} />
                      Duplicate
                    </button>
                    <button 
                      onClick={handleDeleteNode}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
                </>
                )}
              </div>
              {selectedNode && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <button 
                    onClick={() => {
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? selectedNode : n));
                      fetch(`/api/nodes/${selectedNode.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(selectedNode)
                      });
                      setIsPanelOpen(false);
                    }}
                    className="w-full py-2 bg-primary text-white rounded-lg text-sm font-semibold shadow-md hover:bg-blue-600 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Status Bar */}
      <footer className="z-20 bg-surface border-t border-slate-200 dark:border-slate-800 px-4 py-2 shrink-0 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {/* Timer */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-app rounded-md">
            <Clock size={18} className={cn("transition-colors", isTimerRunning ? "text-primary animate-pulse" : "text-slate-500 dark:text-slate-400")} />
            <span className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 w-[46px] text-center">{formatTime(timerSeconds)}</span>
          </div>
          <button 
            onClick={toggleTimer}
            className="p-1.5 text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-app"
            title={isTimerRunning ? "Pause Timer" : "Start Timer"}
          >
            {isTimerRunning ? (
              <div className="w-5 h-5 flex items-center justify-center gap-0.5">
                <div className="w-1.5 h-3 bg-current rounded-sm"></div>
                <div className="w-1.5 h-3 bg-current rounded-sm"></div>
              </div>
            ) : (
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-current border-b-[5px] border-b-transparent ml-0.5"></div>
            )}
          </button>
          <button className="p-1.5 text-yellow-500 hover:text-yellow-600 transition-colors rounded-full hover:bg-yellow-50 dark:hover:bg-yellow-900/20" title="Focus Mode">
            <Zap size={20} fill="currentColor" />
          </button>
        </div>
        {/* Mastery Status Toggle */}
        <div className="flex bg-app p-1 rounded-lg">
          <button 
            onClick={() => setFilterStatus('new')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all",
              filterStatus === 'new' 
                ? "bg-surface text-primary shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            New
          </button>
          <button 
            onClick={() => setFilterStatus('review')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all",
              filterStatus === 'review' 
                ? "bg-surface text-orange-500 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Review
          </button>
          <button 
            onClick={() => setFilterStatus('mastered')}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-all",
              filterStatus === 'mastered' 
                ? "bg-surface text-green-600 dark:text-green-400 shadow-sm" 
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            )}
          >
            Mastered
          </button>
          {filterStatus !== 'all' && (
            <button 
              onClick={() => setFilterStatus('all')}
              className="px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-600 ml-1"
              title="Clear Filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </footer>
      <ExportMapModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        mapTitle={map?.title || 'Mind Map'}
        nodes={nodes}
        onExport={handleExportMap}
      />
    </div>
  );
};
