import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Paywall } from "@/components/Paywall";
import { UpgradeBanner } from "@/components/UpgradeBanner";
import {
  incrementGenerationCount,
  shouldShowUpgradeBanner,
  trackCTAShown,
  trackCTAClicked,
  hasReachedLimit,
  hasPaidAccess,
} from "@/lib/generationTracker";
import { useT } from "@/lib/i18n";

interface FormData {
  companyName: string;
  targetJobTitle: string;
  problemTheyFace: string;
  yourProduct: string;
  keyBenefit: string;
  callToAction: string;
  tone: string;
}

interface FormErrors {
  companyName?: string;
  targetJobTitle?: string;
  problemTheyFace?: string;
  yourProduct?: string;
  keyBenefit?: string;
  callToAction?: string;
  tone?: string;
}

export default function Generate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useT();
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    targetJobTitle: "",
    problemTheyFace: "",
    yourProduct: "",
    keyBenefit: "",
    callToAction: "",
    tone: "Professional",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  // Check if user should see upgrade banner on mount
  useEffect(() => {
    setShowBanner(shouldShowUpgradeBanner());
  }, []);

  // Character limits (from design spec)
  const limits = {
    companyName: { min: 1, max: 50 },
    targetJobTitle: { min: 1, max: 100 },
    problemTheyFace: { min: 10, max: 300 },
    yourProduct: { min: 10, max: 200 },
    keyBenefit: { min: 10, max: 150 },
    callToAction: { min: 10, max: 100 },
  };

  const validateField = (name: keyof FormData, value: string): string | undefined => {
    // Tone is always valid (dropdown)
    if (name === "tone") return undefined;

    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return t('generate.validation.required');
    }

    const limit = limits[name as keyof typeof limits];
    if (limit) {
      if (trimmedValue.length < limit.min) {
        return t('generate.validation.min', { min: limit.min });
      }
      if (trimmedValue.length > limit.max) {
        return t('generate.validation.max', { max: limit.max });
      }
    }

    return undefined;
  };

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleBlur = (name: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user has reached free limit (3 generations) and hasn't paid
    if (hasReachedLimit() && !hasPaidAccess()) {
      setShowPaywall(true);
      trackCTAShown('modal');
      toast({
        message: 'You\'ve used your 3 free sequences. Upgrade to continue.',
        type: 'error',
      });
      return; // BLOCK submission
    }

    // Validate all fields
    const newErrors: FormErrors = {};
    const requiredFields: (keyof FormData)[] = [
      "companyName",
      "targetJobTitle",
      "problemTheyFace",
      "yourProduct",
      "keyBenefit",
      "callToAction",
    ];

    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      allTouched[field] = true;
    });
    setTouched(allTouched);

    // If no errors, submit to API
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.status === 402) {
          // Show paywall modal instead of just a toast
          setShowPaywall(true);
          toast({
            message: t('generate.error.limit'),
            type: 'error',
          });
          return;
        }

        if (!response.ok) {
          const error = await response.json();
          toast({
            message: error.message || t('generate.error.failed'),
            type: 'error',
          });
          return;
        }

        const result = await response.json();

        // Increment generation counter (only for non-paid users)
        if (!hasPaidAccess()) {
          incrementGenerationCount();
        }

        // Store sequence in sessionStorage for the output page
        sessionStorage.setItem('sequence', JSON.stringify(result.sequence));

        // Navigate to output page
        navigate('/output');
      } catch (error) {
        console.error('Generation error:', error);
        toast({
          message: t('generate.error.generic'),
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isFormValid = () => {
    const hasAllFields =
      formData.companyName.trim() &&
      formData.targetJobTitle.trim() &&
      formData.problemTheyFace.trim() &&
      formData.yourProduct.trim() &&
      formData.keyBenefit.trim() &&
      formData.callToAction.trim();

    const hasNoErrors = Object.values(errors).every((error) => !error);

    return hasAllFields && hasNoErrors;
  };

  const getCharCount = (field: keyof typeof limits) => {
    const current = formData[field].length;
    const max = limits[field].max;
    return `${current}/${max}`;
  };

  const handleUpgradeClick = (tier: 'monthly' | 'lifetime') => {
    trackCTAClicked(tier, 'modal');
  };

  const handleBannerUpgradeClick = () => {
    setShowPaywall(true);
    trackCTAShown('banner');
  };

  return (
    <>
      <Paywall
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        source="modal"
        onUpgradeClick={handleUpgradeClick}
      />
      {showBanner && <UpgradeBanner onUpgradeClick={handleBannerUpgradeClick} />}
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 max-w-2xl py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('generate.back')}
            </button>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {t('generate.title')}
              </h1>
              <p className="text-muted-foreground">
                {t('generate.subtitle')}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('generate.section.basic')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. Company Name */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    {t('generate.field.companyName')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="companyName"
                    placeholder={t('generate.field.companyName.placeholder')}
                    value={formData.companyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("companyName", e.target.value)}
                    onBlur={() => handleBlur("companyName")}
                    className={errors.companyName ? "border-destructive" : ""}
                    maxLength={limits.companyName.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.companyName ? (
                        <span className="text-destructive">{errors.companyName}</span>
                      ) : (
                        t('generate.field.companyName.help')
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("companyName")}
                    </span>
                  </div>
                </div>

                {/* 2. Target Job Title */}
                <div className="space-y-2">
                  <Label htmlFor="targetJobTitle">
                    {t('generate.field.targetJobTitle')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="targetJobTitle"
                    placeholder={t('generate.field.targetJobTitle.placeholder')}
                    value={formData.targetJobTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("targetJobTitle", e.target.value)}
                    onBlur={() => handleBlur("targetJobTitle")}
                    className={errors.targetJobTitle ? "border-destructive" : ""}
                    maxLength={limits.targetJobTitle.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.targetJobTitle ? (
                        <span className="text-destructive">{errors.targetJobTitle}</span>
                      ) : (
                        t('generate.field.targetJobTitle.help')
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("targetJobTitle")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('generate.section.problem')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 3. Problem They Face */}
                <div className="space-y-2">
                  <Label htmlFor="problemTheyFace">
                    {t('generate.field.problemTheyFace')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="problemTheyFace"
                    placeholder={t('generate.field.problemTheyFace.placeholder')}
                    value={formData.problemTheyFace}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("problemTheyFace", e.target.value)}
                    onBlur={() => handleBlur("problemTheyFace")}
                    className={errors.problemTheyFace ? "border-destructive resize-none" : "resize-none"}
                    rows={3}
                    maxLength={limits.problemTheyFace.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.problemTheyFace ? (
                        <span className="text-destructive">{errors.problemTheyFace}</span>
                      ) : (
                        t('generate.field.problemTheyFace.help')
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("problemTheyFace")}
                    </span>
                  </div>
                </div>

                {/* 4. Your Product */}
                <div className="space-y-2">
                  <Label htmlFor="yourProduct">
                    {t('generate.field.yourProduct')} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="yourProduct"
                    placeholder={t('generate.field.yourProduct.placeholder')}
                    value={formData.yourProduct}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("yourProduct", e.target.value)}
                    onBlur={() => handleBlur("yourProduct")}
                    className={errors.yourProduct ? "border-destructive resize-none" : "resize-none"}
                    rows={3}
                    maxLength={limits.yourProduct.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.yourProduct ? (
                        <span className="text-destructive">{errors.yourProduct}</span>
                      ) : (
                        t('generate.field.yourProduct.help')
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("yourProduct")}
                    </span>
                  </div>
                </div>

                {/* 5. Key Benefit */}
                <div className="space-y-2">
                  <Label htmlFor="keyBenefit">
                    {t('generate.field.keyBenefit')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="keyBenefit"
                    placeholder={t('generate.field.keyBenefit.placeholder')}
                    value={formData.keyBenefit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("keyBenefit", e.target.value)}
                    onBlur={() => handleBlur("keyBenefit")}
                    className={errors.keyBenefit ? "border-destructive" : ""}
                    maxLength={limits.keyBenefit.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.keyBenefit ? (
                        <span className="text-destructive">{errors.keyBenefit}</span>
                      ) : (
                        t('generate.field.keyBenefit.help')
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("keyBenefit")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">{t('generate.section.cta')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 6. Call to Action */}
                <div className="space-y-2">
                  <Label htmlFor="callToAction">
                    {t('generate.field.callToAction')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="callToAction"
                    placeholder={t('generate.field.callToAction.placeholder')}
                    value={formData.callToAction}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("callToAction", e.target.value)}
                    onBlur={() => handleBlur("callToAction")}
                    className={errors.callToAction ? "border-destructive" : ""}
                    maxLength={limits.callToAction.max}
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      {errors.callToAction ? (
                        <span className="text-destructive">{errors.callToAction}</span>
                      ) : (
                        t('generate.field.callToAction.help')
                      )}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {getCharCount("callToAction")}
                    </span>
                  </div>
                </div>

                {/* 7. Tone */}
                <div className="space-y-2">
                  <Label htmlFor="tone">
                    {t('generate.field.tone')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value: string) => handleChange("tone", value)}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">{t('generate.tone.professional')}</SelectItem>
                      <SelectItem value="Casual">{t('generate.tone.casual')}</SelectItem>
                      <SelectItem value="Direct">{t('generate.tone.direct')}</SelectItem>
                      <SelectItem value="Friendly">{t('generate.tone.friendly')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('generate.field.tone.help')}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Submit Button */}
            {isLoading && (
              <div className="w-full bg-primary rounded-lg p-4 space-y-2">
                <div className="text-sm font-medium text-primary-foreground text-center">
                  {t('generate.loading')}
                </div>
                {/* 12-second progress bar animation */}
                <div className="w-full bg-primary-foreground/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary-foreground h-full rounded-full transition-all"
                    style={{
                      animation: 'progressBar 12s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                    }}
                  />
                </div>
                <div className="text-xs text-primary-foreground/70 text-center">
                  {t('generate.loading.time')}
                </div>
              </div>
            )}
            {!isLoading && (
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!isFormValid()}
              >
                {t('generate.submit')}
              </Button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              {t('generate.required.note')}
            </p>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
