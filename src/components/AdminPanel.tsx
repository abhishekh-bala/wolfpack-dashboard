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
  MessageSquare,
  Loader2,
  CalendarDays,
  CalendarRange,
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
  viewMode: 'day' | 'month';
  onViewModeChange: (mode: 'day' | 'month') => void;
}

export function AdminPanel({
  targets,
  formulas,
  onSaveTargets,
  onSaveFormulas,
  onResetFormulas,
  viewMode,
  onViewModeChange,
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
      loginName: '',
      targetOrders: 0,
      targetRevenue: 0,
      targetConversion: 0,
      chatCount: 0,
      monthlyTargetOrders: 0,
      monthlyTargetRevenue: 0,
      monthlyTargetConversion: 0,
      monthlyChatCount: 0,
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

  const handleTargetChange = (name: string, field: keyof GuideTarget, value: number | string) => {
    setLocalTargets(localTargets.map((t) => (t.name === name ? { ...t, [field]: value } : t)));
  };

  const handleSaveTargets = async () => {
    setIsSaving(true);
    await onSaveTargets(localTargets);
    setIsSaving(false);
  };

  const handleFormulaChange = (id: string, formula: string) => {
    setLocalFormulas(localFormulas.map((f) => (f.id === id ? { ...f, formula } : f)));
  };

  const handleFormulaToggle = (id: string, enabled: boolean) => {
    setLocalFormulas(localFormulas.map((f) => (f.id === id ? { ...f, enabled } : f)));
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
        <Button variant="outline" className="gap-1 sm:gap-2 px-2 sm:px-3 border-primary/30 hover:border-primary hover:bg-primary/10 text-xs sm:text-sm">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Admin Panel</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col bg-card border-border">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <DialogTitle className="text-lg sm:text-xl font-bold text-gradient">Admin Configuration</DialogTitle>
            {/* Day / Month toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('day')}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'day' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Day
              </button>
              <button
                onClick={() => onViewModeChange('month')}
                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Month
              </button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="guides" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3 bg-muted text-xs sm:text-sm">
            <TabsTrigger value="guides" className="gap-1 sm:gap-2 px-1 sm:px-3">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{viewMode === 'day' ? 'Daily' : 'Monthly'}</span> Targets
            </TabsTrigger>
            <TabsTrigger value="chats" className="gap-1 sm:gap-2 px-1 sm:px-3">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{viewMode === 'day' ? 'Daily' : 'Monthly'}</span> Chats
            </TabsTrigger>
            <TabsTrigger value="formulas" className="gap-1 sm:gap-2 px-1 sm:px-3">
              <Calculator className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Formula</span> <span className="hidden xs:inline sm:hidden">Form.</span>
            </TabsTrigger>
          </TabsList>

          {/* Guides & Targets Tab */}
          <TabsContent value="guides" className="flex-1 overflow-hidden flex flex-col mt-4">
            {/* Add new guide */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                placeholder="Enter guide name (e.g., 'Doe, John')"
                value={newGuideName}
                onChange={(e) => setNewGuideName(e.target.value)}
                className="input-dark flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddGuide()}
              />
              <Button onClick={handleAddGuide} className="gap-2 gradient-primary whitespace-nowrap">
                <Plus className="w-4 h-4" />
                Add Guide
              </Button>
            </div>

            {/* Guides list */}
            <div className="flex-1 overflow-auto space-y-3 pr-2">
              {localTargets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No guides added yet. Add guides to set targets.
                </div>
              ) : (
                localTargets.map((target) => (
                  <div key={target.name} className="glass-card p-3 sm:p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-foreground text-sm sm:text-base truncate pr-2">{target.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGuide(target.name)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Login Name field - only visible when in monthly mode for CSV mapping */}
                    {viewMode === 'month' && (
                      <div className="mb-3">
                        <Label className="text-xs text-muted-foreground">
                          Login Name (for CSV mapping)
                        </Label>
                        <Input
                          type="text"
                          placeholder="e.g., jdoe, john.doe"
                          value={target.loginName || ''}
                          onChange={(e) =>
                            handleTargetChange(target.name, 'loginName', e.target.value)
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {viewMode === 'day' ? 'Target Orders' : 'Monthly Orders'}
                        </Label>
                        <Input
                          type="number"
                          value={viewMode === 'day' ? target.targetOrders : target.monthlyTargetOrders}
                          onChange={(e) =>
                            handleTargetChange(
                              target.name,
                              viewMode === 'day' ? 'targetOrders' : 'monthlyTargetOrders',
                              Number(e.target.value)
                            )
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {viewMode === 'day' ? 'Target Revenue ($)' : 'Monthly Revenue ($)'}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={viewMode === 'day' ? target.targetRevenue : target.monthlyTargetRevenue}
                          onChange={(e) =>
                            handleTargetChange(
                              target.name,
                              viewMode === 'day' ? 'targetRevenue' : 'monthlyTargetRevenue',
                              Number(e.target.value)
                            )
                          }
                          className="input-dark mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          {viewMode === 'day' ? 'Target Conv. (%)' : 'Monthly Conv. (%)'}
                        </Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={viewMode === 'day' ? target.targetConversion : target.monthlyTargetConversion}
                          onChange={(e) =>
                            handleTargetChange(
                              target.name,
                              viewMode === 'day' ? 'targetConversion' : 'monthlyTargetConversion',
                              Number(e.target.value)
                            )
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
              <Button onClick={handleSaveTargets} className="gap-2 gradient-primary" disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save {viewMode === 'day' ? 'Daily' : 'Monthly'} Targets
              </Button>
            </div>
          </TabsContent>

          {/* Chat Counts Tab */}
          <TabsContent value="chats" className="flex-1 overflow-hidden flex flex-col mt-4">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Quickly update {viewMode === 'day' ? 'daily' : 'monthly'} chat counts for each guide.
            </p>

            <div className="flex-1 overflow-auto pr-2">
              {localTargets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No guides added yet. Add guides in the "Targets" tab first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {localTargets.map((target) => (
                    <div
                      key={target.name}
                      className="glass-card p-3 animate-fade-in flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="font-medium text-foreground truncate text-sm">{target.name}</span>
                      </div>
                      <Input
                        type="number"
                        value={viewMode === 'day' ? target.chatCount : target.monthlyChatCount}
                        onChange={(e) =>
                          handleTargetChange(
                            target.name,
                            viewMode === 'day' ? 'chatCount' : 'monthlyChatCount',
                            Number(e.target.value)
                          )
                        }
                        className="input-dark w-20 sm:w-24 text-center"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <Button onClick={handleSaveTargets} className="gap-2 gradient-primary" disabled={isSaving || localTargets.length === 0}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save {viewMode === 'day' ? 'Daily' : 'Monthly'} Chats
              </Button>
            </div>
          </TabsContent>

          {/* Formula Overrides Tab */}
          <TabsContent value="formulas" className="flex-1 overflow-hidden flex flex-col mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              Override calculation formulas. Use JavaScript expressions with variables:{' '}
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
                        onCheckedChange={(checked) => handleFormulaToggle(formula.id, checked)}
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
              <Button variant="outline" onClick={handleResetFormulas} className="gap-2" disabled={isSaving}>
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </Button>
              <Button onClick={handleSaveFormulas} className="gap-2 gradient-primary" disabled={isSaving}>
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

