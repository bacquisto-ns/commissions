import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export type ReportTemplate = {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  logoUrl: string;
  layout: string;
};

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "default-1",
    name: "Corporate Blue",
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    companyName: "Your Company",
    logoUrl: "",
    layout: "standard"
  },
  {
    id: "default-2",
    name: "Modern Green",
    primaryColor: "#047857",
    secondaryColor: "#10b981",
    companyName: "Your Company",
    logoUrl: "",
    layout: "compact"
  },
  {
    id: "default-3",
    name: "Visual Purple",
    primaryColor: "#6d28d9",
    secondaryColor: "#8b5cf6",
    companyName: "Your Company",
    logoUrl: "",
    layout: "visual"
  },
  {
    id: "default-4",
    name: "Detailed Red",
    primaryColor: "#b91c1c",
    secondaryColor: "#ef4444",
    companyName: "Your Company",
    logoUrl: "",
    layout: "detailed"
  }
];

interface ReportStylerProps {
  primaryColor: string;
  secondaryColor: string;
  companyName: string;
  logoUrl: string;
  layout: string;
  onPrimaryColorChange: (color: string) => void;
  onSecondaryColorChange: (color: string) => void;
  onCompanyNameChange: (name: string) => void;
  onLogoUrlChange: (url: string) => void;
  onLayoutChange: (layout: string) => void;
}

export function ReportTemplateSelector({
  primaryColor,
  secondaryColor,
  companyName,
  logoUrl,
  layout,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onCompanyNameChange,
  onLogoUrlChange,
  onLayoutChange
}: ReportStylerProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("custom");

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('reportTemplates');
    const savedTemplates = savedData ? JSON.parse(savedData) : [];
    setTemplates([...DEFAULT_TEMPLATES, ...savedTemplates]);
  }, []);

  // Load a template
  const loadTemplate = (templateId: string) => {
    if (templateId === "custom") {
      setSelectedTemplate("custom");
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    onPrimaryColorChange(template.primaryColor);
    onSecondaryColorChange(template.secondaryColor);
    onCompanyNameChange(template.companyName);
    onLogoUrlChange(template.logoUrl);
    onLayoutChange(template.layout);
    setSelectedTemplate(templateId);
  };
  
  // Save current template
  const saveCurrentTemplate = () => {
    const templateName = prompt("Enter a name for this template:", "My Template");
    if (!templateName) return;
    
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      primaryColor,
      secondaryColor,
      companyName,
      logoUrl,
      layout
    };
    
    const updatedTemplates = [...templates.filter(t => !DEFAULT_TEMPLATES.some(d => d.id === t.id)), newTemplate];
    setTemplates(updatedTemplates);
    
    // Save to localStorage
    localStorage.setItem('reportTemplates', JSON.stringify(updatedTemplates));
    
    toast({
      title: "Template saved",
      description: `"${templateName}" has been saved and can be reused for future reports`
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Report Style</h2>
      
      <div className="space-y-4">
        <div>
          <Label>Template</Label>
          <Select
            value={selectedTemplate}
            onValueChange={loadTemplate}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Company Name</Label>
          <Input 
            value={companyName}
            onChange={(e) => onCompanyNameChange(e.target.value)}
            placeholder="Your Company"
          />
        </div>
        
        <div>
          <Label>Logo URL</Label>
          <Input 
            value={logoUrl}
            onChange={(e) => onLogoUrlChange(e.target.value)}
            placeholder="https://example.com/logo.png"
          />
        </div>
        
        <div>
          <Label>Primary Color</Label>
          <div className="flex items-center mt-1 space-x-2">
            <div 
              className="w-10 h-10 rounded cursor-pointer border" 
              style={{ backgroundColor: primaryColor }}
            />
            <Input 
              value={primaryColor}
              onChange={(e) => onPrimaryColorChange(e.target.value)}
              className="flex-grow"
            />
          </div>
        </div>
        
        <div>
          <Label>Secondary Color</Label>
          <div className="flex items-center mt-1 space-x-2">
            <div 
              className="w-10 h-10 rounded cursor-pointer border" 
              style={{ backgroundColor: secondaryColor }}
            />
            <Input 
              value={secondaryColor}
              onChange={(e) => onSecondaryColorChange(e.target.value)}
              className="flex-grow"
            />
          </div>
        </div>
        
        <div>
          <Label>Report Layout</Label>
          <Select
            value={layout}
            onValueChange={onLayoutChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="visual">Visual</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground mt-1">
            Choose how your report content is displayed
          </p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={saveCurrentTemplate}
          className="w-full"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Current Settings as Template
        </Button>
      </div>
    </Card>
  );
}