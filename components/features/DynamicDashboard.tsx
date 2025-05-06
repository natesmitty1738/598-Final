import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Maximize2, Minimize2, X, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// type for module configuration
export interface ModuleConfig {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  defaultSize?: 'small' | 'medium' | 'large' | 'full'; // size options
  defaultHeight?: 'compact' | 'normal' | 'tall' | 'auto'; // height options
  minimizable?: boolean;
  removable?: boolean;
}

// type for saving module state
interface ModuleState {
  id: string;
  visible: boolean;
  size: 'small' | 'medium' | 'large' | 'full';
  height: 'compact' | 'normal' | 'tall' | 'auto';
  minimized: boolean;
  order: number;
}

interface SortableModuleProps {
  id: string;
  module: ModuleConfig;
  state: ModuleState;
  onRemove: (id: string) => void;
  onMinimize: (id: string) => void;
  onChangeSize: (id: string, size: 'small' | 'medium' | 'large' | 'full') => void;
  onChangeHeight: (id: string, height: 'compact' | 'normal' | 'tall' | 'auto') => void;
  availableSizes: ('small' | 'medium' | 'large' | 'full')[];
  availableHeights: ('compact' | 'normal' | 'tall' | 'auto')[];
}

// sortable module component
const SortableModule = ({ 
  id, 
  module, 
  state, 
  onRemove, 
  onMinimize, 
  onChangeSize, 
  onChangeHeight,
  availableSizes,
  availableHeights
}: SortableModuleProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [showHeightControl, setShowHeightControl] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // determine column span based on size
  const getColSpan = () => {
    switch (state.size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      case 'full': return 'col-span-full';
      default: return 'col-span-1';
    }
  };
  
  // determine height based on height property
  const getHeight = () => {
    if (state.minimized) return 'h-auto';
    
    switch (state.height) {
      case 'compact': return 'h-[250px]';
      case 'normal': return 'h-[400px]';
      case 'tall': return 'h-[550px]';
      case 'auto': return 'h-auto';
      default: return 'h-[400px]';
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`${getColSpan()} transition-all duration-200 ease-in-out w-full`}
    >
      <Card className={`h-full flex flex-col ${state.minimized ? 'h-auto' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center">
            <div
              {...attributes}
              {...listeners}
              className="mr-2 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{module.title}</CardTitle>
              {module.description && !state.minimized && (
                <CardDescription>{module.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {/* Width/Size control */}
            {availableSizes.length > 1 && (
              <Select 
                value={state.size} 
                onValueChange={(value) => onChangeSize(id, value as any)}
              >
                <SelectTrigger className="h-7 w-[90px]">
                  <SelectValue placeholder="Width" />
                </SelectTrigger>
                <SelectContent>
                  {availableSizes.includes('small') && (
                    <SelectItem value="small">Small</SelectItem>
                  )}
                  {availableSizes.includes('medium') && (
                    <SelectItem value="medium">Medium</SelectItem>
                  )}
                  {availableSizes.includes('large') && (
                    <SelectItem value="large">Large</SelectItem>
                  )}
                  {availableSizes.includes('full') && (
                    <SelectItem value="full">Full</SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
            
            {/* Height control button */}
            {!state.minimized && availableHeights.length > 1 && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowHeightControl(!showHeightControl)}
                  className="h-7 w-7"
                >
                  {state.height === 'compact' ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : state.height === 'tall' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
                
                {/* Height dropdown */}
                {showHeightControl && (
                  <div className="absolute right-0 top-full mt-1 bg-popover p-2 rounded-md shadow-md z-10 w-28">
                    <div className="flex flex-col space-y-1">
                      {availableHeights.includes('compact') && (
                        <Button 
                          variant={state.height === 'compact' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          onClick={() => {
                            onChangeHeight(id, 'compact');
                            setShowHeightControl(false);
                          }}
                          className="justify-start h-7"
                        >
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Compact
                        </Button>
                      )}
                      {availableHeights.includes('normal') && (
                        <Button 
                          variant={state.height === 'normal' ? 'secondary' : 'ghost'} 
                          size="sm"
                          onClick={() => {
                            onChangeHeight(id, 'normal');
                            setShowHeightControl(false);
                          }}
                          className="justify-start h-7"
                        >
                          <ArrowUp className="h-3 w-3 mr-1" />
                          Normal
                        </Button>
                      )}
                      {availableHeights.includes('tall') && (
                        <Button 
                          variant={state.height === 'tall' ? 'secondary' : 'ghost'} 
                          size="sm"
                          onClick={() => {
                            onChangeHeight(id, 'tall');
                            setShowHeightControl(false);
                          }}
                          className="justify-start h-7"
                        >
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Tall
                        </Button>
                      )}
                      {availableHeights.includes('auto') && (
                        <Button 
                          variant={state.height === 'auto' ? 'secondary' : 'ghost'} 
                          size="sm"
                          onClick={() => {
                            onChangeHeight(id, 'auto');
                            setShowHeightControl(false);
                          }}
                          className="justify-start h-7"
                        >
                          <ArrowDown className="h-3 w-3 mr-1" />
                          Auto
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Minimize button */}
            {module.minimizable && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onMinimize(id)}
                className="h-7 w-7"
              >
                {state.minimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Remove button */}
            {module.removable && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onRemove(id)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className={`flex-grow overflow-auto ${state.minimized ? 'hidden' : getHeight()}`}>
          {module.component}
        </CardContent>
      </Card>
    </div>
  );
};

interface DynamicDashboardProps {
  title?: string;
  modules: ModuleConfig[];
  storageKey: string; // unique key for localStorage
  columns?: number; // number of grid columns (default 4)
  availableSizes?: ('small' | 'medium' | 'large' | 'full')[];
  availableHeights?: ('compact' | 'normal' | 'tall' | 'auto')[];
  autoFill?: boolean; // whether to auto-fill empty spaces (default true)
}

export default function DynamicDashboard({ 
  title, 
  modules, 
  storageKey,
  columns = 4,
  availableSizes = ['small', 'medium', 'large', 'full'],
  availableHeights = ['compact', 'normal', 'tall', 'auto'],
  autoFill = true
}: DynamicDashboardProps) {
  // initialize module states from localStorage or defaults
  const [moduleStates, setModuleStates] = useState<ModuleState[]>(() => {
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem(`dashboard-${storageKey}`);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // validate saved state against current modules
          const validModules = parsed.filter((state: ModuleState) => 
            modules.some(m => m.id === state.id)
          );
          return validModules;
        } catch (e) {
          console.error('Failed to parse saved dashboard state', e);
        }
      }
    }
    
    // default state if no saved state or on SSR
    return modules.map((module, index) => ({
      id: module.id,
      visible: true,
      size: module.defaultSize || 'medium',
      height: module.defaultHeight || 'normal',
      minimized: false,
      order: index
    }));
  });
  
  // sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // save state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dashboard-${storageKey}`, JSON.stringify(moduleStates));
    }
  }, [moduleStates, storageKey]);
  
  // handle drag end event
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setModuleStates(current => {
        const oldIndex = current.findIndex(m => m.id === active.id);
        const newIndex = current.findIndex(m => m.id === over.id);
        
        const newStates = [...current];
        const [movedItem] = newStates.splice(oldIndex, 1);
        newStates.splice(newIndex, 0, movedItem);
        
        // update order
        return newStates.map((state, index) => ({
          ...state,
          order: index
        }));
      });
    }
  };
  
  // handle remove module
  const handleRemoveModule = (id: string) => {
    setModuleStates(current => 
      current.map(state => 
        state.id === id ? { ...state, visible: false } : state
      )
    );
  };
  
  // handle minimize module
  const handleMinimizeModule = (id: string) => {
    setModuleStates(current => 
      current.map(state => 
        state.id === id ? { ...state, minimized: !state.minimized } : state
      )
    );
  };
  
  // handle change module size
  const handleChangeSize = (id: string, size: 'small' | 'medium' | 'large' | 'full') => {
    setModuleStates(current => 
      current.map(state => 
        state.id === id ? { ...state, size } : state
      )
    );
  };
  
  // handle change module height
  const handleChangeHeight = (id: string, height: 'compact' | 'normal' | 'tall' | 'auto') => {
    setModuleStates(current => 
      current.map(state => 
        state.id === id ? { ...state, height } : state
      )
    );
  };
  
  // restore hidden modules
  const handleRestoreAll = () => {
    setModuleStates(current => 
      current.map(state => ({
        ...state,
        visible: true
      }))
    );
  };
  
  // get visible modules
  const visibleModules = moduleStates
    .filter(state => state.visible)
    .sort((a, b) => a.order - b.order);
  
  // get hidden modules
  const hiddenModules = moduleStates.filter(state => !state.visible);

  // Function to organize modules in a masonry-like layout to fill empty spaces
  const organizeModules = () => {
    if (!autoFill) {
      return visibleModules;
    }
    
    // Make a copy of our modules to organize
    const modules = [...visibleModules];
    const organized = [];
    
    // Create a grid representation
    const grid = Array(columns).fill(0);
    
    // Sort modules by size (bigger first for better space allocation)
    modules.sort((a, b) => {
      const getSize = (state: ModuleState) => {
        switch (state.size) {
          case 'full': return 4;
          case 'large': return 3;
          case 'medium': return 2;
          case 'small': return 1;
          default: return 1;
        }
      };
      return getSize(b) - getSize(a);
    });
    
    // Place each module in the best available spot
    modules.forEach(module => {
      if (module.size === 'full') {
        // Full width modules go at the end of the current row
        organized.push(module);
        grid.fill(grid[0] + 1);
      } else {
        // Determine width of this module
        let width;
        switch (module.size) {
          case 'large': width = 3; break;
          case 'medium': width = 2; break;
          default: width = 1;
        }
        
        // Find the best column to place this module
        let bestCol = 0;
        let minHeight = grid[0];
        
        // Find the lowest point in the grid that can fit the module
        for (let i = 0; i <= columns - width; i++) {
          const maxHeight = Math.max(...grid.slice(i, i + width));
          if (maxHeight < minHeight) {
            minHeight = maxHeight;
            bestCol = i;
          }
        }
        
        // Place the module in the grid and add to organized list
        organized.push({...module, gridColumn: bestCol + 1});
        for (let i = 0; i < width; i++) {
          grid[bestCol + i] = minHeight + 1;
        }
      }
    });
    
    return organized;
  };
  
  const organizedModules = organizeModules();
  
  // grid template columns style based on number of columns
  const gridStyle = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
  };
  
  return (
    <div>
      {title && <h1 className="text-xl font-semibold mb-4">{title}</h1>}
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={visibleModules.map(state => state.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 w-full" style={gridStyle}>
            {organizedModules.map(state => {
              const moduleConfig = modules.find(m => m.id === state.id);
              if (!moduleConfig) return null;
              
              return (
                <SortableModule
                  key={state.id}
                  id={state.id}
                  module={moduleConfig}
                  state={state}
                  onRemove={handleRemoveModule}
                  onMinimize={handleMinimizeModule}
                  onChangeSize={handleChangeSize}
                  onChangeHeight={handleChangeHeight}
                  availableSizes={availableSizes}
                  availableHeights={availableHeights}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
      
      {hiddenModules.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button onClick={handleRestoreAll} variant="outline">
            Restore Hidden Modules ({hiddenModules.length})
          </Button>
        </div>
      )}
    </div>
  );
} 