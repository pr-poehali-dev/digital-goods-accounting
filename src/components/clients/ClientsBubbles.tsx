import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Client {
  id: number;
  client_telegram: string;
  client_name: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  comments: string;
  total_revenue: number;
  purchase_count: number;
  avg_check: number;
  first_purchase: string;
  last_purchase: string;
}

interface Props {
  clients: Client[];
  onClientUpdate: (id: number, updates: Partial<Client>) => void;
}

interface Bubble {
  client: Client;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetX: number;
  targetY: number;
}

const importanceColors = {
  low: '#94a3b8',
  medium: '#60a5fa',
  high: '#fb923c',
  critical: '#f87171'
};

const ClientsBubbles = ({ clients, onClientUpdate }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const animationRef = useRef<number>();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const width = container.clientWidth;
      const height = Math.max(600, window.innerHeight - 300);
      canvas.width = width;
      canvas.height = height;

      if (bubblesRef.current.length === 0) {
        const sortedByRevenue = [...clients].sort((a, b) => b.total_revenue - a.total_revenue);
        const totalClients = sortedByRevenue.length;
        
        bubblesRef.current = clients.map((client) => {
          const radius = Math.max(30, Math.min(80, 30 + client.total_revenue / 300));
          
          let autoImportance = client.importance;
          if (client.importance === 'medium') {
            const clientIndex = sortedByRevenue.findIndex(c => 
              c.client_telegram === client.client_telegram && 
              c.client_name === client.client_name
            );
            const topPercent = (clientIndex / totalClients) * 100;
            
            if (topPercent < 5) autoImportance = 'critical';
            else if (topPercent < 15) autoImportance = 'high';
            else if (topPercent < 50) autoImportance = 'medium';
            else autoImportance = 'low';
          }
          
          return {
            client: { ...client, importance: autoImportance },
            x: Math.random() * (width - radius * 2) + radius,
            y: Math.random() * (height - radius * 2) + radius,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius,
            targetX: width / 2,
            targetY: height / 2
          };
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      for (const bubble of bubblesRef.current) {
        const dx = x - bubble.x;
        const dy = y - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < bubble.radius) {
          setSelectedClient(bubble.client);
          setDialogOpen(true);
          break;
        }
      }
    };

    canvas.addEventListener('click', handleClick);

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      bubblesRef.current.forEach((bubble, i) => {
        bubblesRef.current.forEach((other, j) => {
          if (i === j) return;

          const dx = other.x - bubble.x;
          const dy = other.y - bubble.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = bubble.radius + other.radius + 10;

          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const force = (minDistance - distance) * 0.05;
            bubble.vx -= Math.cos(angle) * force;
            bubble.vy -= Math.sin(angle) * force;
          }
        });

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const toCenterX = centerX - bubble.x;
        const toCenterY = centerY - bubble.y;
        const distanceToCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
        
        if (distanceToCenter > 50) {
          bubble.vx += (toCenterX / distanceToCenter) * 0.02;
          bubble.vy += (toCenterY / distanceToCenter) * 0.02;
        }

        bubble.vx *= 0.95;
        bubble.vy *= 0.95;

        bubble.x += bubble.vx;
        bubble.y += bubble.vy;

        bubble.x = Math.max(bubble.radius, Math.min(canvas.width - bubble.radius, bubble.x));
        bubble.y = Math.max(bubble.radius, Math.min(canvas.height - bubble.radius, bubble.y));

        if (bubble.x <= bubble.radius || bubble.x >= canvas.width - bubble.radius) {
          bubble.vx *= -0.8;
        }
        if (bubble.y <= bubble.radius || bubble.y >= canvas.height - bubble.radius) {
          bubble.vy *= -0.8;
        }
      });

      bubblesRef.current.forEach((bubble) => {
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          0,
          bubble.x,
          bubble.y,
          bubble.radius
        );

        const color = importanceColors[bubble.client.importance];
        gradient.addColorStop(0, color + 'ee');
        gradient.addColorStop(1, color + '99');

        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        const displayName = bubble.client.client_name || bubble.client.client_telegram || 'Без имени';
        const shortName = displayName.length > 10 ? displayName.slice(0, 10) + '...' : displayName;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(13, bubble.radius / 3.5)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(shortName, bubble.x, bubble.y - 5);

        ctx.shadowBlur = 3;
        ctx.shadowOffsetY = 1;
        ctx.font = `600 ${Math.max(11, bubble.radius / 4.5)}px system-ui, -apple-system, sans-serif`;
        ctx.fillText(`${bubble.client.purchase_count} покупок`, bubble.x, bubble.y + bubble.radius + 18);
        
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [clients]);

  const handleSave = () => {
    if (selectedClient) {
      onClientUpdate(selectedClient.id, {
        importance: selectedClient.importance,
        comments: selectedClient.comments
      });
      setDialogOpen(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#94a3b8' }} />
            <span className="text-muted-foreground">Низкая</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#60a5fa' }} />
            <span className="text-muted-foreground">Средняя</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#fb923c' }} />
            <span className="text-muted-foreground">Высокая</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#f87171' }} />
            <span className="text-muted-foreground">Критичный</span>
          </div>
          <div className="ml-auto text-muted-foreground">
            Размер пузырька зависит от дохода • Кликните для деталей
          </div>
        </div>

        <div ref={containerRef} className="relative rounded-lg border bg-card overflow-hidden">
          <canvas 
            ref={canvasRef} 
            className="w-full cursor-pointer"
            style={{ display: 'block' }}
          />
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedClient?.client_name || selectedClient?.client_telegram || 'Клиент'}
            </DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Доход</div>
                  <div className="font-semibold text-lg">{selectedClient.total_revenue.toLocaleString()} ₽</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Покупки</div>
                  <div className="font-semibold text-lg">{selectedClient.purchase_count}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Средний чек</div>
                  <div className="font-semibold text-lg">{selectedClient.avg_check.toLocaleString()} ₽</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Последняя покупка</div>
                  <div className="font-medium">
                    {new Date(selectedClient.last_purchase).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>

              <div>
                <Label>Важность</Label>
                <Select
                  value={selectedClient.importance}
                  onValueChange={(v: any) => setSelectedClient({ ...selectedClient, importance: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкая</SelectItem>
                    <SelectItem value="medium">Средняя</SelectItem>
                    <SelectItem value="high">Высокая</SelectItem>
                    <SelectItem value="critical">Критичный</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Комментарии</Label>
                <Textarea
                  value={selectedClient.comments || ''}
                  onChange={(e) => setSelectedClient({ ...selectedClient, comments: e.target.value })}
                  placeholder="Заметки о клиенте..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} className="w-full">
                Сохранить
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClientsBubbles;