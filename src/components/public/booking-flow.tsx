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

import type { PublicBusiness, PublicBarber, PublicService } from "@/lib/public/business";
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
  barberName: string;
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
  barbers: PublicBarber[];
  services: PublicService[];
  barberServicesMap: Record<string, string[]>;
}

export function BookingFlow({
  business,
  barbers,
  services,
  barberServicesMap,
}: BookingFlowProps) {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();

  // URL Params pre-selection
  const initialBarber = React.useMemo(() => {
    const barberParam = searchParams.get("barber");
    if (barberParam && barbers.length > 0) {
      return barbers.find((b) => b.id === barberParam) || null;
    }
    return barbers.length === 1 ? barbers[0] : null;
  }, [searchParams, barbers]);

  const initialService = React.useMemo(() => {
    const serviceParam = searchParams.get("service");
    if (serviceParam && services.length > 0) {
      return services.find((s) => s.id === serviceParam) || null;
    }
    return null;
  }, [searchParams, services]);

  // Steps: 1=Barber, 2=Service, 3=Date & Time, 4=Details, 5=Review, 6=Success
  const [step, setStep] = React.useState<number>(() => {
    if (initialBarber && initialService) return 3;
    if (initialBarber) return 2;
    return 1;
  });

  // Selected State
  const [selectedBarber, setSelectedBarber] = React.useState<PublicBarber | null>(initialBarber);
  const [selectedService, setSelectedService] = React.useState<PublicService | null>(initialService);
  const [selectedDate, setSelectedDate] = React.useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [selectedSlot, setSelectedSlot] = React.useState<AvailableSlot | null>(null);

  // Customer Form State
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Slots loading & error states
  const [availableSlots, setAvailableSlots] = React.useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Confirmed booking summary state
  const [confirmedBooking, setConfirmedBooking] = React.useState<ConfirmedBookingSummary | null>(null);

  // Filter available services for selected barber
  const availableServicesForBarber = React.useMemo(() => {
    if (!selectedBarber) return [];
    const assignedIds = barberServicesMap[selectedBarber.id] || [];
    // If no explicit mapping exists, fall back to all active services for primary/only barber
    if (assignedIds.length === 0 && barbers.length === 1) {
      return services;
    }
    return services.filter((s) => assignedIds.includes(s.id));
  }, [selectedBarber, services, barberServicesMap, barbers]);

  // Load available slots asynchronously when barber, service, or date changes
  React.useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return;
    let isMounted = true;

    const loadSlots = async () => {
      setLoadingSlots(true);
      setErrorMsg(null);
      setSelectedSlot(null);

      const res = await fetchAvailableSlotsAction(
        selectedBarber.id,
        selectedService.id,
        selectedDate
      );
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
  }, [selectedBarber, selectedService, selectedDate]);

  const handleSelectBarber = (barber: PublicBarber) => {
    setSelectedBarber(barber);
    // Reset service if it's not offered by the newly selected barber
    if (selectedService) {
      const assignedIds = barberServicesMap[barber.id] || [];
      if (assignedIds.length > 0 && !assignedIds.includes(selectedService.id)) {
        setSelectedService(null);
      }
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleSelectService = (svc: PublicService) => {
    setSelectedService(svc);
    setErrorMsg(null);
    setStep(3);
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
    setStep(5);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setErrorMsg(null);

    const res = await createPublicBookingAction({
      businessSlug: business.slug,
      barberId: selectedBarber.id,
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
      setStep(6);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const stepLabels = [
    { num: 1, label: lang === "hu" ? "01 BORBÉLY" : "01 BARBER" },
    { num: 2, label: lang === "hu" ? "02 SZOLGÁLTATÁS" : "02 SERVICE" },
    { num: 3, label: lang === "hu" ? "03 DÁTUM ÉS IDŐ" : "03 DATE & TIME" },
    { num: 4, label: lang === "hu" ? "04 ADATOK" : "04 DETAILS" },
    { num: 5, label: lang === "hu" ? "05 ÖSSZEGZÉS" : "05 REVIEW" },
  ];

  return (
    <div className="mx-auto max-w-4xl w-full px-4 py-8 sm:px-6 sm:py-16 space-y-10">
      {/* 1. Minimal Header */}
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
      {step < 6 && (
        <div className="grid grid-cols-5 gap-1.5 border-b border-white/10 pb-4">
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
                <span className="text-[10px] sm:text-xs tracking-wider uppercase font-mono block truncate">
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

      {/* STEP 1: CHOOSE BARBER */}
      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "1. LÉPÉS" : "STEP 01"}</span>
            <h2 className="text-3xl font-normal text-foreground font-serif">
              {lang === "hu" ? "Válasszon borbélyt" : "Choose Your Barber"}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {barbers.map((barber) => {
              const bio = getLocalizedField(barber, "bio", lang);
              const isSelected = selectedBarber?.id === barber.id;

              return (
                <div
                  key={barber.id}
                  onClick={() => handleSelectBarber(barber)}
                  className={`group relative rounded-sm border p-6 cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-white/10 bg-card hover:border-primary/50 hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative size-16 shrink-0 rounded-full overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
                      {barber.profile_photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={barber.profile_photo_url}
                          alt={barber.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <User className="size-8 text-primary/70" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-normal font-serif text-foreground group-hover:text-primary transition-colors">
                          {barber.name}
                        </h3>
                        {isSelected && (
                          <CheckCircle2 className="size-5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-light line-clamp-3 leading-relaxed">
                        {bio || (lang === "hu" ? "Tapasztalt férfi fodrász és borbély." : "Master barber specializing in traditional cuts & precision styling.")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">
                      {lang === "hu" ? "ELÉRHETŐ" : "AVAILABLE"}
                    </span>
                    <Button size="xs" variant={isSelected ? "default" : "outline"}>
                      {lang === "hu" ? "Borbély kiválasztása" : "Select Barber"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT SERVICE */}
      {step === 2 && selectedBarber && (
        <div className="space-y-8">
          {/* Selected Barber Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center">
                {selectedBarber.profile_photo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selectedBarber.profile_photo_url} alt={selectedBarber.name} className="size-full object-cover" />
                ) : (
                  <User className="size-5 text-primary" />
                )}
              </div>
              <div>
                <span className="eyebrow">{lang === "hu" ? "KIVÁLASZTOTT BORBÉLY" : "SELECTED BARBER"}</span>
                <h3 className="text-lg font-normal text-foreground font-serif">
                  {selectedBarber.name}
                </h3>
              </div>
            </div>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => setStep(1)}
              className="gap-1.5 text-xs text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="size-3.5" />
              <span>{lang === "hu" ? "MÁSIK BORBÉLY" : "CHANGE BARBER"}</span>
            </Button>
          </div>

          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "2. LÉPÉS" : "STEP 02"}</span>
            <h2 className="text-3xl font-normal text-foreground font-serif">
              {t.step1Title}
            </h2>
          </div>

          <div className="divide-y divide-white/10 border-t border-b border-white/10">
            {availableServicesForBarber.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground font-light">
                {lang === "hu" ? "Nincs elérhető szolgáltatás ehhez a borbélyhoz." : "No services configured for this barber yet."}
              </div>
            ) : (
              availableServicesForBarber.map((svc, idx) => {
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
              })
            )}
          </div>
        </div>
      )}

      {/* STEP 3: SELECT DATE & TIME SLOT */}
      {step === 3 && selectedBarber && selectedService && (
        <div className="space-y-8">
          {/* Summary Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="eyebrow">{lang === "hu" ? "BORBÉLY" : "BARBER"}</span>
                <p className="text-sm font-serif text-foreground font-medium">{selectedBarber.name}</p>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <span className="eyebrow">{t.selectedServiceLabel}</span>
                <p className="text-sm font-serif text-foreground font-medium">
                  {getLocalizedField(selectedService, "name", lang)}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => setStep(2)}
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
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="size-4" />
              <span>{t.prevStep}</span>
            </Button>

            <Button
              onClick={() => setStep(4)}
              disabled={!selectedSlot}
              className="gap-2 px-8"
            >
              <span>{t.nextStep}</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: CUSTOMER DETAILS */}
      {step === 4 && (
        <form onSubmit={handleDetailsNext} className="space-y-8">
          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "4. LÉPÉS" : "STEP 04"}</span>
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
              onClick={() => setStep(3)}
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

      {/* STEP 5: REVIEW & CONFIRM */}
      {step === 5 && selectedBarber && selectedService && selectedSlot && (
        <div className="space-y-8">
          <div className="space-y-1">
            <span className="eyebrow">{lang === "hu" ? "5. LÉPÉS" : "STEP 05"}</span>
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
                <span className="eyebrow block mb-1">{lang === "hu" ? "BORBÉLY" : "BARBER"}</span>
                <span className="font-serif text-lg font-medium text-foreground flex items-center gap-2">
                  <User className="size-4 text-primary" />
                  {selectedBarber.name}
                </span>
              </div>

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
              onClick={() => setStep(4)}
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

      {/* STEP 6: SUCCESS SCREEN */}
      {step === 6 && confirmedBooking && (
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
              <span className="text-muted-foreground">{lang === "hu" ? "Borbély" : "Barber"}:</span>
              <span className="font-serif font-medium text-foreground">
                {confirmedBooking.barberName}
              </span>
            </div>

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
                setSelectedBarber(barbers.length === 1 ? barbers[0] : null);
                setSelectedService(null);
                setSelectedDate(todayStr);
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
