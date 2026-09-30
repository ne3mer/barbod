"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

import type { PublicBusiness, PublicService } from "@/lib/public/business";
import type { AvailableSlot } from "@/lib/booking/availability";
import { useLanguage } from "@/lib/i18n/context";
import { getLocalizedField } from "@/lib/i18n/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  fetchAvailableSlotsAction,
  createPublicBookingAction,
} from "@/app/(site)/book/actions";

export type ConfirmedBookingSummary = {
  id: string;
  serviceNameEn: string;
  serviceNameHu: string;
  durationMinutes: number;
  price: number;
  currency: string;
  dateStr: string;
  startTimeStr: string;
  customerName: string;
  status: string;
};

interface BookingFlowProps {
  business: PublicBusiness;
  services: PublicService[];
}

export function BookingFlow({ business, services }: BookingFlowProps) {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();

  // Lazy compute initial service from URL parameter
  const initialService = React.useMemo(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.length > 0) {
      return services.find((s) => s.id === serviceParam) || null;
    }
    return null;
  }, [searchParams, services]);

  // Wizard Steps: 1=Service, 2=Date & Time, 3=Details, 4=Review, 5=Success
  const [step, setStep] = React.useState<number>(initialService ? 2 : 1);

  // Selected State
  const [selectedService, setSelectedService] = React.useState<PublicService | null>(
    initialService
  );
  const [selectedDate, setSelectedDate] = React.useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(
    null
  );

  // Customer Form State
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Slots loading & error states
  const [availableSlots, setAvailableSlots] = React.useState<AvailableSlot[]>(
    []
  );
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Confirmed booking summary state
  const [confirmedBooking, setConfirmedBooking] =
    React.useState<ConfirmedBookingSummary | null>(null);

  // Load available slots asynchronously when date or service changes
  React.useEffect(() => {
    if (!selectedService || !selectedDate) return;
    let isMounted = true;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setErrorMsg(null);
      setSelectedSlot(null);

      const res = await fetchAvailableSlotsAction(selectedService.id, selectedDate);
      if (!isMounted) return;

      setLoadingSlots(false);
      if (res.error) {
        setErrorMsg(res.error);
        setAvailableSlots([]);
      } else {
        setAvailableSlots(res.slots);
      }
    };

    loadSlots();

    return () => {
      isMounted = false;
    };
  }, [selectedService, selectedDate]);

  const handleSelectService = (svc: PublicService) => {
    setSelectedService(svc);
    setErrorMsg(null);
    setStep(2);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleSelectSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setErrorMsg(null);
  };

  const handleDetailsNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg(t.errorRequiredFields);
      return;
    }
    setErrorMsg(null);
    setStep(4);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setErrorMsg(null);

    const res = await createPublicBookingAction({
      businessSlug: business.slug,
      serviceId: selectedService.id,
      dateStr: selectedDate,
      startTimeStr: selectedSlot.timeStr,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    });

    setSubmitting(false);

    if (res.error) {
      if (res.errorCode === "SLOT_UNAVAILABLE") {
        setErrorMsg(t.errorConflict);
      } else if (res.errorCode === "REQUIRED_FIELDS") {
        setErrorMsg(t.errorRequiredFields);
      } else if (res.errorCode === "PAST_DATE") {
        setErrorMsg(t.errorPastBooking);
      } else if (res.errorCode === "SERVICE_UNAVAILABLE") {
        setErrorMsg(t.errorServiceUnavailable);
      } else {
        setErrorMsg(t.errorGeneric);
      }
    } else if (res.success && res.booking) {
      setConfirmedBooking(res.booking as ConfirmedBookingSummary);
      setStep(5);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const stepLabels = [
    { num: 1, label: lang === "hu" ? "01 SZOLGÁLTATÁS" : "01 SERVICE" },
    { num: 2, label: lang === "hu" ? "02 DÁTUM ÉS IDŐ" : "02 DATE & TIME" },
    { num: 3, label: lang === "hu" ? "03 ADATOK" : "03 DETAILS" },
    { num: 4, label: lang === "hu" ? "04 ÖSSZEGZÉS" : "04 REVIEW" },
  ];

  return (
    <div className="mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 sm:py-16 space-y-10">
      {/* 1. Minimal Focused Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-6">
        <div className="flex flex-col">
          <span className="font-serif tracking-[0.2em] uppercase text-lg font-medium text-foreground leading-none">
            BARBOD
          </span>
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-sans mt-1">
            BARBER ATELIER · {t.bookingTitle}
          </span>
        </div>

        <Link
          href="/"
          className="text-xs uppercase tracking-widest font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" />
          <span>{lang === "hu" ? "VISSZA A WEBOLDALRA" : "RETURN TO WEBSITE"}</span>
        </Link>
      </div>

      {/* 2. Refined Editorial Progress Indicator */}
      {step < 5 && (
        <div className="grid grid-cols-4 gap-2 border-b border-white/10 pb-4">
          {stepLabels.map((s) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div
                key={s.num}
                className={`text-center py-2 transition-all ${
                  isActive
                    ? "border-b-2 border-primary text-primary font-bold"
                    : isCompleted
                    ? "text-foreground/80 font-medium"
                    : "text-muted-foreground/40 font-normal"
                }`}
              >
                <span className="text-[11px] sm:text-xs tracking-wider uppercase font-mono block">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMsg && (
        <div className="flex items-center gap-3 rounded-sm bg-destructive/15 p-4 text-xs font-medium text-destructive border border-destructive/30 animate-in fade-in">
          <AlertCircle className="size-4 shrink-0 text-destructive" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SELECT SERVICE */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "1. LÉPÉS" : "STEP 01"}</span>
            <h2 className="text-3xl font-normal text-foreground font-serif">
              {t.step1Title}
            </h2>
          </div>

          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {services.map((svc, idx) => {
              const name = getLocalizedField(svc, "name", lang);
              const desc = getLocalizedField(svc, "description", lang);
              const isSelected = selectedService?.id === svc.id;
              const priceFormatted = new Intl.NumberFormat(
                lang === "hu" ? "hu-HU" : "en-US"
              ).format(svc.price);
              const indexStr = String(idx + 1).padStart(2, "0");

              return (
                <div
                  key={svc.id}
                  onClick={() => handleSelectService(svc)}
                  className={`group flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 px-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-primary/10 border-l-2 border-primary"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-6">
                    <span className="font-mono text-sm font-semibold text-primary/70 pt-1 shrink-0">
                      {indexStr}
                    </span>

                    <div className="space-y-1 max-w-lg">
                      <h3 className="text-xl font-normal text-foreground font-serif group-hover:text-primary transition-colors">
                        {name}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed font-light">
                        {desc || t.defaultServiceDesc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 pt-2 md:pt-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-mono text-muted-foreground">
                        {svc.duration_minutes} {t.duration}
                      </div>
                      <div className="text-base font-sans font-bold text-primary mt-0.5">
                        {priceFormatted} {svc.currency}
                      </div>
                    </div>

                    <Button size="xs" variant={isSelected ? "default" : "outline"}>
                      {t.nextStep}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DATE & TIME SLOT */}
      {step === 2 && (
        <div className="space-y-8">
          {/* Selected Service Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <span className="eyebrow">{t.selectedServiceLabel}</span>
              <h3 className="text-xl font-normal text-foreground font-serif mt-0.5">
                {selectedService && getLocalizedField(selectedService, "name", lang)}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setStep(1)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t.changeService}</span>
            </Button>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            {/* Date Selector */}
            <div className="space-y-4">
              <h2 className="text-2xl font-normal text-foreground font-serif">
                {t.step2Title}
              </h2>

              <div className="space-y-2">
                <Label htmlFor="date_picker" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.dateLabel}
                </Label>
                <Input
                  id="date_picker"
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full text-sm font-mono h-12 bg-card/90 border-white/10"
                />
              </div>
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-4">
              <h2 className="text-2xl font-normal text-foreground font-serif">
                {t.step3Title}
              </h2>

              {loadingSlots ? (
                <div className="flex items-center justify-center p-12 border border-white/10 rounded-sm bg-card/60">
                  <Loader2 className="size-5 animate-spin text-primary mr-2" />
                  <span className="text-xs text-muted-foreground font-mono">
                    {t.loadingSlots}
                  </span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-sm text-center bg-card/40">
                  <p className="text-xs text-muted-foreground font-light">
                    {t.noSlotsAvailable}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot?.timeStr === slot.timeStr;
                    return (
                      <button
                        key={slot.timeStr}
                        type="button"
                        onClick={() => handleSelectSlot(slot)}
                        className={`rounded-sm border px-3 py-3 text-xs font-mono font-semibold transition-all ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-white/10 bg-card text-foreground hover:border-primary/60 hover:bg-white/[0.04]"
                        }`}
                      >
                        {slot.formattedTime}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-white/10">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button
              onClick={() => setStep(3)}
              disabled={!selectedSlot}
              className="gap-2 px-8"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: CUSTOMER DETAILS */}
      {step === 3 && (
        <form onSubmit={handleDetailsNext} className="space-y-8">
          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "3. LÉPÉS" : "STEP 03"}</span>
            <h2 className="text-2xl font-normal text-foreground font-serif">
              {t.step4Title}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cust_name" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {t.fullName} *
              </Label>
              <Input
                id="cust_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                className="h-12 bg-card/90 border-white/10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cust_phone" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                {t.phoneNumber} *
              </Label>
              <Input
                id="cust_phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
                className="h-12 bg-card/90 border-white/10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust_email" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              {t.emailAddress}
            </Label>
            <Input
              id="cust_email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="h-12 bg-card/90 border-white/10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust_notes" className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              {t.notesLabel}
            </Label>
            <Textarea
              id="cust_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="bg-card/90 border-white/10 rounded-sm focus:border-primary p-3"
              rows={3}
            />
          </div>

          <div className="flex justify-between pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button type="submit" className="gap-2 px-8">
              <span>{t.nextStep}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </form>
      )}

      {/* STEP 4: REVIEW & CONFIRM */}
      {step === 4 && selectedService && selectedSlot && (
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "4. LÉPÉS" : "STEP 04"}</span>
            <h2 className="text-2xl font-normal text-foreground font-serif">
              {t.step5Title}
            </h2>
          </div>

          {/* Ticket-Style Summary Receipt */}
          <div className="rounded-sm border border-white/10 bg-card p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="border-b border-white/10 pb-5 flex items-center justify-between">
              <div>
                <span className="eyebrow">{t.serviceLabel}</span>
                <h3 className="text-2xl font-normal text-foreground font-serif mt-0.5">
                  {getLocalizedField(selectedService, "name", lang)}
                </h3>
              </div>
              <span className="text-xl font-bold font-sans text-primary">
                {selectedService.price} {selectedService.currency}
              </span>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 text-sm">
              <div>
                <span className="eyebrow block mb-1">{t.dateTimeLabel}</span>
                <span className="font-semibold font-mono text-foreground flex items-center gap-2 text-base">
                  <CalendarIcon className="size-4 text-primary" />
                  {selectedDate} {selectedSlot.formattedTime}
                </span>
              </div>

              <div>
                <span className="eyebrow block mb-1">{t.durationLabel}</span>
                <span className="font-semibold font-mono text-foreground flex items-center gap-2 text-base">
                  <Clock className="size-4 text-primary" />
                  {selectedService.duration_minutes} {t.duration}
                </span>
              </div>

              <div>
                <span className="eyebrow block mb-1">{t.fullName}</span>
                <span className="font-medium text-foreground flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  {customerName}
                </span>
              </div>

              <div>
                <span className="eyebrow block mb-1">{t.phoneNumber}</span>
                <span className="font-medium text-foreground flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  {customerPhone}
                </span>
              </div>
            </div>

            {notes && (
              <div className="border-t border-white/10 pt-4 text-xs">
                <span className="eyebrow block mb-1">{t.notesLabel}</span>
                <p className="mt-1 text-foreground bg-white/[0.03] p-3 rounded-sm border border-white/5 font-light">
                  {notes}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-6 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="gap-2"
            >
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button
              onClick={handleConfirmSubmit}
              disabled={submitting}
              className="gap-2.5 px-10 text-sm uppercase tracking-wider font-semibold shadow-md"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{t.submittingBooking}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>{t.confirmBooking}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS SCREEN */}
      {step === 5 && confirmedBooking && (
        <div className="py-12 space-y-8 text-center max-w-xl mx-auto">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-emerald-500/10 p-5 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="size-12" />
            </div>
            <Badge variant="warning">{t.statusBadgePending}</Badge>
            <h1 className="text-3xl sm:text-4xl font-normal text-foreground font-serif">
              {t.successHeadline}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md font-light">
              {t.successMessage}
            </p>
          </div>

          <div className="rounded-sm border border-white/10 bg-card p-6 text-left space-y-4 shadow-xl">
            <h3 className="eyebrow border-b border-white/10 pb-3">
              {t.bookingDetails}
            </h3>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.serviceLabel}:</span>
              <span className="font-serif font-medium text-foreground">
                {lang === "hu"
                  ? confirmedBooking.serviceNameHu || confirmedBooking.serviceNameEn
                  : confirmedBooking.serviceNameEn}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.dateTimeLabel}:</span>
              <span className="font-mono font-semibold text-primary">
                {confirmedBooking.dateStr} {confirmedBooking.startTimeStr}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.customerLabel}:</span>
              <span className="font-medium text-foreground">
                {confirmedBooking.customerName}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t.priceLabel}:</span>
              <span className="font-bold text-primary font-sans">
                {confirmedBooking.price} {confirmedBooking.currency}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto uppercase tracking-wider text-xs">
                {t.backToHome}
              </Button>
            </Link>
            <Button
              onClick={() => {
                setSelectedService(null);
                setSelectedDate("");
                setSelectedSlot(null);
                setCustomerName("");
                setCustomerPhone("");
                setCustomerEmail("");
                setNotes("");
                setStep(1);
              }}
              className="w-full sm:w-auto uppercase tracking-wider text-xs font-semibold"
            >
              {t.bookAnother}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
