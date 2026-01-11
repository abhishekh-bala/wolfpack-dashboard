import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GuideTarget, FormulaOverride } from '@/hooks/useGuideTargets';
import { 
  Plus, 
  Trash2, 
  Save, 
  RotateCcw,
  Settings2,
  Users,
  Calculator,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  targets: GuideTarget[];
  formulas: FormulaOverride[];
  onSaveTargets: (targets: GuideTarget[]) => Promise<void>;
  onSaveFormulas: (formulas: FormulaOverride[]) => Promise<void>;
  onResetFormulas: () => Promise<void>;
}

export function AdminPanel({ 
  targets, 
  formulas, 
  onSaveTargets, 
  onSaveFormulas, 
  onResetFormulas 
}: AdminPanelProps) {
  const [localTargets, setLocalTargets] = useState<GuideTarget[]>(targets);
  const [localFormulas, setLocalFormulas] = useState<FormulaOverride[]>(formulas);
  const [newGuideName, setNewGuideName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLocalTargets(targets);
  }, [targets]);

  useEffect(() => {
    setLocalFormulas(formulas);
  }, [formulas]);

  const handleAddGuide = () => {
    if (!newGuideName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a guide name.',
        variant: 'destructive',
      });
      return;
    }

    const exists = localTargets.some(
      (t) => t.name.toLowerCase() === newGuideName.trim().toLowerCase()
    );

    if (exists) {
      toast({
        title: 'Error',
        description: 'A guide with this name already exists.',
        variant: 'destructive',
      });
      return;
    }

    const newTarget: GuideTarget = {
      name: newGuideName.trim(),
      targetOrders: 0,
      targetRevenue: 0,
      targetConversion: 0,
      chatCount: 0,
    };

    setLocalTargets([...localTargets, newTarget]);
    setNewGuideName('');
    toast({
      title: 'Guide Added',
      description: `${newGuideName.trim()} has been added. Don't forget to save!`,
    });
  };

  const handleRemoveGuide = (name: string) => {
    setLocalTargets(localTargets.filter((t) => t.name !== name));
    toast({
      title: 'Guide Removed',
      description: `${name} has been removed. Don't forget to save!`,
    });
  };

  const handleTargetChange = (
    name: string,
    field: keyof GuideTarget,
    value: number
  ) => {
    setLocalTargets(
      localTargets.map((t) =>
        t.name === name ? { ...t, [field]: value } : t
      )
    );
  };

  const handleSaveTargets = async () => {
    setIsSaving(true);
    await onSaveTargets(localTargets);
    setIsSaving(false);
  };

  const handleFormulaChange = (id: string, formula: string) => {
    setLocalFormulas(
      localFormulas.map((f) => (f.id === id ? { ...f, formula } : f))
    );
  };

  const handleFormulaToggle = (id: string, enabled: boolean) => {
    setLocalFormulas(
      localFormulas.map((f) => (f.id === id ? { ...f, enabled } : f))
    );
  };

  const handleSaveFormulas = async () => {
    setIsSaving(true);
    await onSaveFormulas(localFormulas);
    setIsSaving(false);
  };

  const handleResetFormulas = async () => {
    setIsSaving(true);
    await onResetFormulas();
    setIsSaving(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10">
          <Settings2 className="w-4 h-4" />
          Admin Panel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gradient">
            Admin Configuration
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="guides" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="guides" className="gap-2">
              <Users className="w-4 h-4" />
              Guides & Targets
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-2">
              <Users className="w-4 h-4" />
              Update Chats
            </TabsTrigger>
            <TabsTrigger value="formulas" className="gap-2">
              <Calculator className="w-4 h-4" />
              Formula Overrides
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guides" className="flex-1 overflow-hidden flex flex-col mt-4">
            {/* Add new guide */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter guide name (e.g., 'Doe, John')"
                value={newGuideName}
                onChange={(e) => setNewGuideName(e.target.value)}
                className="input-dark"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGuide()}
              />
              <Button onClick={handleAddGuide} className="gap-2 gradient-primary">
                <Plus className="w-4 h-4" />
                Add Guide
              </Button>
            </div>

            {/* Guides list */}
            <div className="flex-1 overflow-auto space-y-3 pr-2">
              {localTargets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No guides added yet. Add guides to set targets.
                </div>
              ) : (
                localTargets.map((target) => (
                  <div
                    key={target.name}
                    className="glass-card p-4 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground">{target.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGuide(target.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Orders</Label>
                        <Input
                          type="number"
                          value={target.targetOrders}
                          onChange={(e) =>
                            handleTargetChange(target.name, 'targetOrders', Number(e.target.value))
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Revenue ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={target.targetRevenue}
                          onChange={(e) =>
                            handleTargetChange(target.name, 'targetRevenue', Number(e.target.value))
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Target Conv. (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={target.targetConversion}
                          onChange={(e) =>
                            handleTargetChange(target.name, 'targetConversion', Number(e.target.value))
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Chat Count</Label>
                        <Input
                          type="number"
                          value={target.chatCount}
                          onChange={(e) =>
                            handleTargetChange(target.name, 'chatCount', Number(e.target.value))
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button 
                onClick={handleSaveTargets} 
                className="gap-2 gradient-primary"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save All Targets
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="chats" className="flex-1 overflow-hidden flex flex-col mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Quickly update chat counts for all guides. This is useful for tracking conversation metrics.
            </p>

            <div className="flex-1 overflow-auto space-y-3 pr-2">
              {localTargets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No guides available. Add guides first to update their chat counts.
                </div>
              ) : (
                localTargets.map((target) => (
                  <div
                    key={target.name}
                    className="glass-card p-4 animate-fade-in flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{target.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Current chat count: {target.chatCount}
                      </p>
                    </div>
                    <div className="w-32">
                      <Input
                        type="number"
                        value={target.chatCount}
                        onChange={(e) =>
                          handleTargetChange(target.name, 'chatCount', Number(e.target.value))
                        }
                        className="input-dark"
                        placeholder="Chat count"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button
                onClick={handleSaveTargets}
                className="gap-2 gradient-primary"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Chat Updates
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="formulas" className="flex-1 overflow-hidden flex flex-col mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Override calculation formulas. Use JavaScript expressions with variables: 
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">orders</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">newRevenue</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">targetOrders</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">targetRevenue</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">chatCount</code>,
              <code className="mx-1 px-1.5 py-0.5 bg-muted rounded text-xs">targetConversion</code>
            </p>

            <div className="flex-1 overflow-auto space-y-4 pr-2">
              {localFormulas.map((formula) => (
                <div key={formula.id} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formula.enabled}
                        onCheckedChange={(checked) =>
                          handleFormulaToggle(formula.id, checked)
                        }
                      />
                      <Label className="font-medium text-foreground">{formula.name}</Label>
                    </div>
                  </div>
                  <Input
                    value={formula.formula}
                    onChange={(e) => handleFormulaChange(formula.id, e.target.value)}
                    className="input-dark font-mono text-sm"
                    disabled={!formula.enabled}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button 
                variant="outline" 
                onClick={handleResetFormulas} 
                className="gap-2"
                disabled={isSaving}
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </Button>
              <Button 
                onClick={handleSaveFormulas} 
                className="gap-2 gradient-primary"
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Formulas
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
