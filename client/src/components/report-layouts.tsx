import { format } from 'date-fns';

interface ReportHeaderProps {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  reportTitle: string;
  subtitle: string;
  reportLayout: string;
}

export function ReportHeader({
  companyName,
  logoUrl,
  primaryColor,
  reportTitle,
  subtitle,
  reportLayout
}: ReportHeaderProps) {
  return (
    <div className={`flex ${reportLayout === 'compact' ? 'items-start' : 'justify-between items-center'} mb-6`}>
      <div>
        <h1 
          className={`${reportLayout === 'detailed' ? 'text-3xl' : 'text-2xl'} font-bold`} 
          style={{ color: reportLayout === 'visual' ? 'white' : primaryColor }}
        >
          {companyName}
        </h1>
        <h2 className={`${reportLayout === 'detailed' ? 'text-2xl' : 'text-xl'} ${reportLayout === 'visual' ? 'text-white/90' : ''}`}>
          {reportTitle}
        </h2>
        <p className={`text-sm ${reportLayout === 'visual' ? 'text-white/80' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
        {reportLayout === 'detailed' && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p>Generated on: {format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
        )}
      </div>
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt="Company Logo" 
          className={`${reportLayout === 'compact' ? 'h-12' : reportLayout === 'detailed' ? 'h-20' : 'h-16'} w-auto object-contain`}
        />
      )}
    </div>
  );
}

interface ReportMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  layout: string;
  primaryColor: string;
  secondaryColor?: string;
  isHighlighted?: boolean;
}

export function ReportMetricCard({
  title,
  value,
  subtitle,
  layout,
  primaryColor,
  secondaryColor,
  isHighlighted
}: ReportMetricCardProps) {
  if (layout === 'visual') {
    return (
      <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
        <p className="text-sm text-white/70">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-sm mt-1 text-white/80">{subtitle}</p>}
      </div>
    );
  }
  
  if (layout === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{title}:</span>
        <span className="text-lg font-bold" style={{ color: isHighlighted ? secondaryColor : primaryColor }}>{value}</span>
      </div>
    );
  }
  
  if (layout === 'detailed') {
    return (
      <div className="border p-5 rounded-lg shadow-sm">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold" style={{ color: isHighlighted ? secondaryColor : primaryColor }}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    );
  }
  
  // Standard layout
  return (
    <div className="bg-gray-50 p-4 rounded-lg" style={{ backgroundColor: `${primaryColor}10` }}>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && <p className="text-sm mt-1" style={{ color: isHighlighted ? secondaryColor : primaryColor }}>{subtitle}</p>}
    </div>
  );
}

export function getStatusBadgeClasses(status: string, reportLayout: string) {
  let baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
  
  if (reportLayout === 'visual') {
    return `${baseClasses} bg-white/20 text-white`;
  }
  
  return status.toLowerCase() === 'approved' 
    ? `${baseClasses} bg-green-100 text-green-800`
    : `${baseClasses} bg-yellow-100 text-yellow-800`;
}

export function getTableCellClasses(reportLayout: string, isHeader = false, alignRight = false) {
  const padding = reportLayout === 'compact' ? 'px-3 py-2' : 'px-6 py-4';
  const alignment = alignRight ? 'text-right' : 'text-left';
  
  if (isHeader) {
    return `${padding} ${alignment} text-xs font-medium ${reportLayout === 'visual' ? 'text-white/90' : 'text-gray-500'} uppercase tracking-wider`;
  }
  
  return `${padding} whitespace-nowrap text-sm ${alignRight ? 'font-medium' : ''}`;
}