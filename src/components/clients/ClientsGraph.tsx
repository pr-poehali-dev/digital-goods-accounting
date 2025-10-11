import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface Client {
  id: number;
  client_telegram: string;
  client_name: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  total_revenue: number;
  purchase_count: number;
}

interface ClientConnection {
  id: number;
  client_id_from: number;
  client_id_to: number;
  connection_type: string;
  description: string;
}

interface Props {
  clients: Client[];
  connections: ClientConnection[];
}

const importanceColors = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f97316',
  critical: '#ef4444'
};

const ClientsGraph = ({ clients, connections }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = 600;
    canvas.width = width;
    canvas.height = height;

    const nodes = clients.map((client, index) => ({
      ...client,
      x: Math.random() * (width - 100) + 50,
      y: Math.random() * (height - 100) + 50,
      vx: 0,
      vy: 0
    }));

    const edges = connections
      .map(conn => {
        const from = nodes.find(n => n.id === conn.client_id_from);
        const to = nodes.find(n => n.id === conn.client_id_to);
        return from && to ? { from, to, type: conn.connection_type } : null;
      })
      .filter(Boolean) as { from: typeof nodes[0]; to: typeof nodes[0]; type: string }[];

    let animationId: number;

    const simulate = () => {
      ctx.clearRect(0, 0, width, height);

      edges.forEach(edge => {
        ctx.beginPath();
        ctx.moveTo(edge.from.x, edge.from.y);
        ctx.lineTo(edge.to.x, edge.to.y);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();

        const midX = (edge.from.x + edge.to.x) / 2;
        const midY = (edge.from.y + edge.to.y) / 2;
        ctx.fillStyle = '#64748b';
        ctx.font = '11px sans-serif';
        ctx.fillText(edge.type, midX + 5, midY - 5);
      });

      nodes.forEach(node => {
        for (const other of nodes) {
          if (node === other) continue;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 150) {
            const force = (150 - dist) / dist * 0.5;
            node.vx -= dx * force;
            node.vy -= dy * force;
          }
        }

        edges.forEach(edge => {
          if (edge.from === node || edge.to === node) {
            const other = edge.from === node ? edge.to : edge.from;
            const dx = other.x - node.x;
            const dy = other.y - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 200) / dist * 0.1;
            node.vx += dx * force;
            node.vy += dy * force;
          }
        });

        node.vx *= 0.8;
        node.vy *= 0.8;

        node.x += node.vx;
        node.y += node.vy;

        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      });

      nodes.forEach(node => {
        const radius = Math.min(20 + node.total_revenue / 50000, 40);
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = importanceColors[node.importance];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const name = node.client_name || node.client_telegram;
        const shortName = name.length > 15 ? name.slice(0, 15) + '...' : name;
        ctx.fillText(shortName, node.x, node.y);

        ctx.fillStyle = '#1e293b';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${node.purchase_count} покупок`, node.x, node.y + radius + 15);
      });

      animationId = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [clients, connections]);

  return (
    <Card ref={containerRef} className="p-4">
      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-500" />
          <span>Низкая</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500" />
          <span>Средняя</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span>Высокая</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>Критичный</span>
        </div>
        <div className="ml-auto text-muted-foreground">
          Размер узла зависит от дохода
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full border rounded-lg" />
    </Card>
  );
};

export default ClientsGraph;
