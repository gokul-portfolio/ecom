"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ColumnDef } from "@tanstack/react-table";
import {
  Sparkles,
  Layers,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Package,
  Plus,
  ArrowRight,
  Eye,
  Trash2,
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Boxes,
  Code2,
  Filter,
  Scale,
  MapPin,
  Globe,
  Radio,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import {
  Button,
  ButtonVariant,
  ButtonSize,
  AddButton,
  EditButton,
  DeleteButton,
  CancelButton,
  SubmitButton,
  SaveButton,
  BackButton,
  RefreshButton,
  ExportButton,
  CopyButton,
  ButtonGroup,
  IconButton,
  ViewIconButton,
  DeleteIconButton,
  EditIconButton,
  CopyIconButton,
  RefreshIconButton,
} from "@/components/ui/button";

import {
  FormField,
  TextInput,
  PasswordInput,
  NumberInput,
  PriceInput,
  TextArea,
  SelectInput,
  MultiSelect,
  Checkbox,
  Switch,
  RadioGroup,
  OTPInput,
  FileUpload,
  ColorPicker,
  SlugInput,
  DatePicker,
  TimePicker,
  FormSection,
  FormActions,
  UOMInput,
  UOMValue,
  UOMMultiSelect,
  PhoneInput,
  PhoneValue,
  AddressInput,
  AddressValue,
  SearchableSelect,
} from "@/components/ui/form";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSearch,
  FilterDropdown,
} from "@/components/ui/dropdown";
import Link from "next/link";

import {
  DataTable,
  StatusBadgeCell,
  PriceCell,
  StockCell,
  RatingCell,
  ImageCell,
  Pagination,
} from "@/components/ui/table";

import {
  Modal,
  ModalFooter,
  ConfirmDialog,
  DeleteConfirmDialog,
  Drawer,
  Tooltip,
} from "@/components/ui/modal";

import {
  Alert,
  Badge,
  BadgeVariant,
  StatusBadge,
  Spinner,
  Loader,
  Skeleton,
  ProgressBar,
  EmptyState,
  ErrorState,
  Tabs,
  ToastProvider,
  useToast,
} from "@/components/ui/feedback";

import { ActionMenu } from "@/components/ui/dropdown";
import { ProductCard, StatCard } from "@/components/ui/cards";
import { useFormKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { Kbd } from "@/components/common/Kbd";
import { RealtimeSocketPlayground } from "@/components/common/RealtimeSocketPlayground";

// Sample Table Data Definition
interface ShowcaseProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  rating: number;
  reviewsCount: number;
  imageUrl: string;
}

const SAMPLE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: "prod-1",
    name: "Chronograph Automatic Watch",
    sku: "WTC-8821",
    category: "Accessories",
    price: 389.0,
    originalPrice: 450.0,
    stock: 24,
    status: "In Stock",
    rating: 4.9,
    reviewsCount: 128,
    imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-2",
    name: "Cashmere Knit Sweater",
    sku: "APP-4019",
    category: "Apparel",
    price: 195.0,
    originalPrice: 220.0,
    stock: 8,
    status: "Low Stock",
    rating: 4.7,
    reviewsCount: 64,
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-3",
    name: "Italian Leather Oxford Shoes",
    sku: "FTW-3312",
    category: "Footwear",
    price: 280.0,
    stock: 0,
    status: "Out of Stock",
    rating: 4.8,
    reviewsCount: 92,
    imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-4",
    name: "Minimalist Canvas Backpack",
    sku: "BAG-1092",
    category: "Bags",
    price: 120.0,
    originalPrice: 150.0,
    stock: 45,
    status: "In Stock",
    rating: 4.6,
    reviewsCount: 38,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-5",
    name: "Wireless Studio Headphones",
    sku: "ELC-9011",
    category: "Electronics",
    price: 349.0,
    stock: 15,
    status: "In Stock",
    rating: 4.9,
    reviewsCount: 210,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-6",
    name: "Polarized Aviator Sunglasses",
    sku: "ACC-5520",
    category: "Accessories",
    price: 165.0,
    originalPrice: 190.0,
    stock: 4,
    status: "Low Stock",
    rating: 4.5,
    reviewsCount: 47,
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-7",
    name: "Mechanical Ergonomic Keyboard",
    sku: "ELC-7721",
    category: "Electronics",
    price: 189.0,
    originalPrice: 219.0,
    stock: 32,
    status: "In Stock",
    rating: 4.8,
    reviewsCount: 154,
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-8",
    name: "Classic Denim Chore Jacket",
    sku: "APP-8840",
    category: "Apparel",
    price: 145.0,
    stock: 12,
    status: "In Stock",
    rating: 4.6,
    reviewsCount: 78,
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-9",
    name: "Suede Chelsea Boots",
    sku: "FTW-6651",
    category: "Footwear",
    price: 240.0,
    originalPrice: 280.0,
    stock: 6,
    status: "Low Stock",
    rating: 4.7,
    reviewsCount: 89,
    imageUrl: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-10",
    name: "Titanium Travel Water Bottle",
    sku: "ACC-9901",
    category: "Accessories",
    price: 68.0,
    stock: 58,
    status: "In Stock",
    rating: 4.9,
    reviewsCount: 312,
    imageUrl: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-11",
    name: "Wireless Charging Desk Pad",
    sku: "ELC-3419",
    category: "Electronics",
    price: 85.0,
    stock: 0,
    status: "Out of Stock",
    rating: 4.4,
    reviewsCount: 42,
    imageUrl: "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-12",
    name: "Merino Wool Beanie Hat",
    sku: "APP-1142",
    category: "Apparel",
    price: 45.0,
    stock: 25,
    status: "In Stock",
    rating: 4.5,
    reviewsCount: 61,
    imageUrl: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-13",
    name: "Handcrafted Leather Wallet",
    sku: "BAG-7734",
    category: "Accessories",
    price: 95.0,
    originalPrice: 110.0,
    stock: 19,
    status: "In Stock",
    rating: 4.8,
    reviewsCount: 117,
    imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-14",
    name: "Noise-Cancelling Earbuds Pro",
    sku: "ELC-5582",
    category: "Electronics",
    price: 219.0,
    stock: 9,
    status: "Low Stock",
    rating: 4.7,
    reviewsCount: 184,
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-15",
    name: "Canvas Weekend Duffel Bag",
    sku: "BAG-4412",
    category: "Bags",
    price: 175.0,
    stock: 14,
    status: "In Stock",
    rating: 4.6,
    reviewsCount: 53,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "prod-16",
    name: "Performance Running Shoes",
    sku: "FTW-9923",
    category: "Footwear",
    price: 160.0,
    originalPrice: 190.0,
    stock: 22,
    status: "In Stock",
    rating: 4.9,
    reviewsCount: 240,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80",
  },
];

// Zod Validation Schema for Test Form
const productFormSchema = z.object({
  productName: z.string().min(3, "Product name must be at least 3 characters"),
  sku: z.string().min(2, "SKU code is required"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Valid price is required",
  }),
  category: z.string().min(1, "Please select a category"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  stock: z.number().min(0, "Stock cannot be negative"),
  published: z.boolean(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ComponentShowcasePage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Enterprise Keyboard Navigation for Form Fields (ArrowDown/Up, Enter/Shift+Enter, Ctrl+Enter)
  const {
    containerRef: formNavRef,
    handleKeyDown: handleFormKeyDown,
  } = useFormKeyboardNavigation<HTMLFormElement>({
    enableArrowKeys: true,
    enableEnterNavigation: true,
    submitOnCtrlEnter: true,
    wrapAround: true,
  });

  // Button Playground State
  const [btnVariant, setBtnVariant] = useState<ButtonVariant>("primary");
  const [btnSize, setBtnSize] = useState<ButtonSize>("md");
  const [btnDisabled, setBtnDisabled] = useState<boolean>(false);
  const [btnLoading, setBtnLoading] = useState<boolean>(false);
  const [btnFullWidth, setBtnFullWidth] = useState<boolean>(false);
  const [btnLeftIcon, setBtnLeftIcon] = useState<boolean>(true);
  const [btnRightIcon, setBtnRightIcon] = useState<boolean>(false);
  const [btnRounded, setBtnRounded] = useState<boolean>(false);

  // Modal Demonstration States
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form States
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>(["cat-apparel", "cat-luxury"]);
  const [otpValue, setOtpValue] = useState<string>("529140");
  const [selectedColor, setSelectedColor] = useState<string>("#6366f1");
  const [slugValue, setSlugValue] = useState<string>("luxury-chronograph-watch");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-15");
  const [selectedTime, setSelectedTime] = useState<string>("10:30 AM");
  const [demoSwitch1, setDemoSwitch1] = useState<boolean>(true);
  const [demoSwitch2, setDemoSwitch2] = useState<boolean>(false);
  const [uomValue, setUomValue] = useState<UOMValue>({ amount: "100", unit: "kg" });
  const [uomMultiValue, setUomMultiValue] = useState<string[]>(["kg", "g", "ton"]);
  const [phoneValue, setPhoneValue] = useState<PhoneValue>({
    countryCode: "IN",
    dialCode: "+91",
    number: "9876543210",
    isValid: true,
  });
  const [addressValue, setAddressValue] = useState<Partial<AddressValue>>({
    country: "IN",
    countryName: "India",
    state: "TN",
    stateName: "Tamil Nadu",
    city: "Chennai",
    pincode: "600001",
    street: "42 Anna Salai, Mount Road",
  });
  const [searchableSelectValue, setSearchableSelectValue] = useState<string>("electronics");
  const [dropdownFilterCategory, setDropdownFilterCategory] = useState<string>("watch");
  const [isFullscreenLoaderActive, setIsFullscreenLoaderActive] = useState<boolean>(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [demoPage, setDemoPage] = useState<number>(3);
  const [demoPageSize, setDemoPageSize] = useState<number>(10);

  const toast = useToast();

  // Custom Action Confirm Dialog state (in-app modal replacing browser alerts)
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    variant?: "primary" | "destructive" | "warning";
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      productName: "",
      sku: "",
      price: "",
      category: "",
      description: "",
      stock: 10,
      published: true,
    },
  });

  const onProductFormSubmit = (data: ProductFormData) => {
    setFormSuccessMessage(`Product "${data.productName}" validated and submitted successfully!`);
    setTimeout(() => setFormSuccessMessage(null), 5000);
    reset();
  };

  // Table Columns Definition
  const tableColumns: ColumnDef<ShowcaseProduct>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(!!e.target.checked)}
          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <ImageCell src={row.original.imageUrl} alt={row.original.name} fallbackText="PRD" />
          <div className="flex flex-col text-left">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs line-clamp-1">
              {row.original.name}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">{row.original.sku}</span>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {row.original.category}
        </span>
      ),
    },
    {
      id: "price",
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <PriceCell amount={row.original.price} originalAmount={row.original.originalPrice} />
      ),
    },
    {
      id: "stock",
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => <StockCell stock={row.original.stock} />,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const val = row.original.status;
        const variant =
          val === "In Stock" ? "success" : val === "Low Stock" ? "warning" : "danger";
        return <StatusBadgeCell status={val} variant={variant} />;
      },
    },
    {
      id: "rating",
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <RatingCell rating={row.original.rating} reviewsCount={row.original.reviewsCount} />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <ActionMenu
          onView={() => {
            setActionModal({
              isOpen: true,
              title: row.original.name,
              message: (
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <p><strong>SKU:</strong> {row.original.sku}</p>
                  <p><strong>Category:</strong> {row.original.category}</p>
                  <p><strong>Price:</strong> ${row.original.price.toFixed(2)}</p>
                  <p><strong>Stock Level:</strong> {row.original.stock} units</p>
                  <p><strong>Status:</strong> {row.original.status}</p>
                </div>
              ),
              confirmLabel: "Close",
              variant: "primary",
              onConfirm: () => setActionModal((prev) => ({ ...prev, isOpen: false })),
            });
          }}
          onEdit={() => {
            toast.info("Edit Product", `Opened specifications for "${row.original.name}"`);
          }}
          onDelete={() => {
            setIsDeleteOpen(true);
          }}
        />
      ),
      enableSorting: false,
    },
  ];

  // Category navigation tabs
  const categoryTabs = [
    { id: "all", label: "All Components" },
    { id: "buttons", label: "Buttons System" },
    { id: "forms", label: "Forms & Inputs" },
    { id: "table", label: "TanStack DataTable" },
    { id: "modals", label: "Modals & Overlays" },
    { id: "feedback", label: "Badges & Feedback" },
    { id: "cards", label: "Cards & Metrics" },
    { id: "realtime", label: "Real-time & WebSockets" },
  ];

  return (
    <ToastProvider>
      <AppLayout>
      <div className="space-y-10 pb-20">
        {/* Showcase Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40 text-left">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Production UI Architecture</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Component Library & UI Playground
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Centralized token-driven design system with TanStack Table, React Hook Form, Zod,
                accessible modals, and specialized e-commerce components.
              </p>
              {/* Quick Jump Stats */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/15">
                  6 Core Modules
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/15">
                  40+ Reusable Components
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/15">
                  TanStack Table v8
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-white border border-white/15">
                  Zod Validated
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsBasicModalOpen(true)}
                leftIcon={<Boxes className="w-3.5 h-3.5" />}
              >
                Quick Modal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsDrawerOpen(true)}
                leftIcon={<Filter className="w-3.5 h-3.5" />}
              >
                Filter Drawer
              </Button>
            </div>
          </div>
        </div>

        {/* Category Navigation Bar - Sticky directly below 56px (h-14) Header */}
        <div className="sticky top-14 z-20 bg-[#f8fafc]/95 dark:bg-[#090e1a]/95 backdrop-blur-md py-2 border-b border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-x-auto scrollbar-none">
          <Tabs
            variant="pill"
            tabs={categoryTabs}
            activeTab={activeCategory}
            onChange={(id) => setActiveCategory(id)}
          />
        </div>

        {/* 1. BUTTONS SYSTEM SECTION */}
        {(activeCategory === "all" || activeCategory === "buttons") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>1. Reusable Button System</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Base component supporting 9 variants, 8 sizes, icon alignment, loading spinners, and
                specialized wrappers.
              </p>
            </div>

            {/* Interactive Button Playground */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Controls Column */}
              <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Interactive Controls
                  </span>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                    Live Reactive
                  </span>
                </div>

                {/* Variant selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Variant
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        "primary",
                        "secondary",
                        "outline",
                        "ghost",
                        "destructive",
                        "success",
                        "warning",
                        "link",
                        "gradient",
                      ] as ButtonVariant[]
                    ).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setBtnVariant(v)}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border capitalize transition-colors ${
                          btnVariant === v
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size selector */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {(["xs", "sm", "md", "lg", "xl"] as ButtonSize[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setBtnSize(s)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md border uppercase transition-colors ${
                          btnSize === s
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boolean Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Checkbox
                    id="btn-loading"
                    label="Loading"
                    checked={btnLoading}
                    onChange={(e) => setBtnLoading(e.target.checked)}
                  />
                  <Checkbox
                    id="btn-disabled"
                    label="Disabled"
                    checked={btnDisabled}
                    onChange={(e) => setBtnDisabled(e.target.checked)}
                  />
                  <Checkbox
                    id="btn-left-icon"
                    label="Left Icon"
                    checked={btnLeftIcon}
                    onChange={(e) => setBtnLeftIcon(e.target.checked)}
                  />
                  <Checkbox
                    id="btn-right-icon"
                    label="Right Icon"
                    checked={btnRightIcon}
                    onChange={(e) => setBtnRightIcon(e.target.checked)}
                  />
                  <Checkbox
                    id="btn-full-width"
                    label="Full Width"
                    checked={btnFullWidth}
                    onChange={(e) => setBtnFullWidth(e.target.checked)}
                  />
                  <Checkbox
                    id="btn-rounded"
                    label="Rounded Pill"
                    checked={btnRounded}
                    onChange={(e) => setBtnRounded(e.target.checked)}
                  />
                </div>
              </div>

              {/* Preview and Generated Code */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Live Preview Canvas */}
                <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col items-center justify-center min-h-[180px]">
                  <Button
                    variant={btnVariant}
                    size={btnSize}
                    disabled={btnDisabled}
                    loading={btnLoading}
                    fullWidth={btnFullWidth}
                    rounded={btnRounded}
                    leftIcon={btnLeftIcon ? <Plus className="w-4 h-4" /> : undefined}
                    rightIcon={btnRightIcon ? <ArrowRight className="w-4 h-4" /> : undefined}
                    onClick={() => {
                      toast.success(
                        "Action Executed",
                        `Triggered ${btnVariant} button in size ${btnSize}.`
                      );
                    }}
                  >
                    Action Button
                  </Button>
                </div>

                {/* Code Snippet */}
                <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono border border-slate-800 text-left overflow-x-auto">
                  <div className="flex items-center gap-1.5 text-slate-400 mb-2 font-sans font-semibold text-[11px]">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Generated Code</span>
                  </div>
                  <code>{`<Button
  variant="${btnVariant}"
  size="${btnSize}"${btnLoading ? "\n  loading" : ""}${btnDisabled ? "\n  disabled" : ""}${btnFullWidth ? "\n  fullWidth" : ""}${btnRounded ? "\n  rounded" : ""}${btnLeftIcon ? "\n  leftIcon={<Plus className='w-4 h-4' />}" : ""}${btnRightIcon ? "\n  rightIcon={<ArrowRight className='w-4 h-4' />}" : ""}
>
  Action Button
</Button>`}</code>
                </div>
              </div>
            </div>

            {/* Specialized Buttons Grid */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Specialized Semantic Wrappers
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <AddButton
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      title: "Add New Product",
                      message: "Would you like to open the new product registration modal to configure title, SKU, and pricing?",
                      confirmLabel: "Create Product",
                      variant: "primary",
                      onConfirm: () => {
                        setActionModal((prev) => ({ ...prev, isOpen: false }));
                        toast.success("Product Initialized", "New catalog draft created successfully.");
                      },
                    });
                  }}
                >
                  Add Product
                </AddButton>

                <EditButton
                  onClick={() => {
                    setActionModal({
                      isOpen: true,
                      title: "Edit Product Record",
                      message: "Open editor for 'Chronograph Automatic Watch' to modify specifications and inventory levels?",
                      confirmLabel: "Open Editor",
                      variant: "primary",
                      onConfirm: () => {
                        setActionModal((prev) => ({ ...prev, isOpen: false }));
                        toast.info("Editor Opened", "Loading product specifications...");
                      },
                    });
                  }}
                >
                  Edit Item
                </EditButton>

                <DeleteButton
                  onClick={() => {
                    setIsDeleteOpen(true);
                  }}
                >
                  Delete Record
                </DeleteButton>

                <SaveButton
                  onClick={() => {
                    toast.success("Saved Successfully", "All configuration parameters have been synchronized.");
                  }}
                >
                  Save Changes
                </SaveButton>

                <SubmitButton
                  onClick={() => {
                    toast.success("Form Dispatched", "Product data successfully transmitted.");
                  }}
                >
                  Submit Form
                </SubmitButton>

                <CancelButton
                  onClick={() => {
                    toast.warning("Cancelled", "Operation was cancelled by user.");
                  }}
                >
                  Cancel
                </CancelButton>

                <BackButton
                  onClick={() => {
                    toast.info("Navigation", "Navigating back to previous view...");
                  }}
                >
                  Go Back
                </BackButton>

                <RefreshButton
                  onClick={() => {
                    toast.info("Data Refreshed", "Catalog dataset re-synchronized.");
                  }}
                />

                <ExportButton
                  onClick={() => {
                    toast.success("Export Complete", "Product report downloaded as CSV.");
                  }}
                />

                <CopyButton textToCopy="PROD-9988" />
              </div>

              {/* Button Group */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">Button Group:</span>
                <ButtonGroup>
                  <Button variant="outline" size="sm">
                    Day
                  </Button>
                  <Button variant="primary" size="sm">
                    Week
                  </Button>
                  <Button variant="outline" size="sm">
                    Month
                  </Button>
                  <Button variant="outline" size="sm">
                    Year
                  </Button>
                </ButtonGroup>
              </div>

              {/* Icon Button Showcase */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Reusable Icon Buttons (IconButton)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Common compact button for icons with presets, sizes (2xs to xl), colors & shapes
                    </p>
                  </div>
                  <Badge variant="primary" size="sm">
                    New Component
                  </Badge>
                </div>

                {/* Common Action Presets */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-3">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Common Action Presets (View, Edit, Delete, Copy, Refresh, Download):
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <ViewIconButton
                      size="md"
                      onClick={() => toast.info("View Details", "Opened product preview card")}
                    />
                    <EditIconButton
                      size="md"
                      onClick={() => toast.info("Edit Record", "Opened editor modal")}
                    />
                    <DeleteIconButton
                      size="md"
                      onClick={() => {
                        setActionModal({
                          isOpen: true,
                          title: "Confirm Deletion",
                          message: "Are you sure you want to delete this record?",
                          variant: "destructive",
                          confirmLabel: "Delete",
                          onConfirm: () => {
                            setActionModal((prev) => ({ ...prev, isOpen: false }));
                            toast.error("Item Deleted", "Record was removed permanently.");
                          },
                        });
                      }}
                    />
                    <CopyIconButton
                      size="md"
                      copyText="PROD-9988-SKU"
                      onClick={() => toast.success("Copied", "SKU copied to clipboard")}
                    />
                    <RefreshIconButton
                      size="md"
                      onClick={() => toast.info("Refreshed", "Synchronized latest data")}
                    />
                    <IconButton
                      preset="download"
                      size="md"
                      onClick={() => toast.success("Download", "Report download initiated")}
                    />
                    <IconButton
                      preset="add"
                      size="md"
                      onClick={() => toast.info("Add", "Add new item clicked")}
                    />
                    <IconButton
                      preset="settings"
                      size="md"
                      onClick={() => toast.info("Settings", "Opened configuration")}
                    />
                  </div>
                </div>

                {/* Size Scale */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Size Scale (2xs to xl):
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {(["2xs", "xs", "sm", "md", "lg", "xl"] as const).map((sz) => (
                      <div key={sz} className="flex flex-col items-center gap-1">
                        <IconButton preset="view" size={sz} variant="subtle" />
                        <span className="text-[10px] font-mono text-slate-400">{sz}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Variants & Shapes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Colors */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Color Variants:
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <IconButton preset="view" variant="primary" size="sm" tooltip="Primary" />
                      <IconButton preset="view" variant="subtle" size="sm" tooltip="Subtle" />
                      <IconButton preset="view" variant="info" size="sm" tooltip="Info (Sky)" />
                      <IconButton preset="view" variant="success" size="sm" tooltip="Success (Emerald)" />
                      <IconButton preset="view" variant="warning" size="sm" tooltip="Warning (Amber)" />
                      <IconButton preset="delete" variant="destructive" size="sm" tooltip="Destructive (Rose)" />
                      <IconButton preset="delete" variant="danger" size="sm" tooltip="Solid Danger" />
                      <IconButton preset="edit" variant="outline" size="sm" tooltip="Outline" />
                      <IconButton preset="edit" variant="ghost" size="sm" tooltip="Ghost" />
                    </div>
                  </div>

                  {/* Shapes & States */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 space-y-2">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Shapes & States:
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <IconButton preset="view" shape="rounded" size="sm" tooltip="Rounded" />
                      <IconButton preset="view" shape="circle" size="sm" tooltip="Circle" />
                      <IconButton preset="view" shape="square" size="sm" tooltip="Square" />
                      <IconButton preset="refresh" loading size="sm" tooltip="Loading" />
                      <IconButton preset="delete" disabled size="sm" tooltip="Disabled" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 2. REUSABLE FORM COMPONENTS & ZOD VALIDATION */}
        {(activeCategory === "all" || activeCategory === "forms") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>2. Reusable Form Components & Zod Validation</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Unified FormField wrapper with error states, password visibility toggle, multi-select,
                OTP input, file uploads, and React Hook Form validation.
              </p>
            </div>

            {formSuccessMessage && (
              <Alert variant="success" title="Validation Succeeded">
                {formSuccessMessage}
              </Alert>
            )}

            {/* ROW 1: Basic Input Primitives & Select Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Card 1: Core Text, Number & Upload Inputs */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Core Text, Number & Upload Controls
                  </h3>
                  <Badge variant="secondary" size="sm">
                    Primitives
                  </Badge>
                </div>

                <FormField label="Standard Text Input" helperText="Standard text field with left icon">
                  <TextInput
                    placeholder="Enter full name"
                    leftIcon={<Users className="w-4 h-4 text-slate-400" />}
                  />
                </FormField>

                <FormField label="Password Input" helperText="With toggle show/hide eye">
                  <PasswordInput placeholder="Enter secure password" />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Number Input (Stepper)">
                    <NumberInput min={0} max={100} step={5} value={25} />
                  </FormField>
                  <FormField label="Price Input">
                    <PriceInput placeholder="249.99" currency="$" />
                  </FormField>
                </div>

                <FormField label="OTP Code Input (6 Digits)" helperText="Auto-focusing discrete verification inputs">
                  <OTPInput length={6} value={otpValue} onChange={setOtpValue} />
                </FormField>

                <FormField label="File Upload (Drag and Drop)" helperText="Drag files or click to browse">
                  <FileUpload
                    multiple
                    value={uploadedFiles}
                    onChange={setUploadedFiles}
                    accept="image/*"
                  />
                </FormField>
              </div>

              {/* Card 2: Select & Combobox Suite */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Select & Combobox Suite
                  </h3>
                  <Badge variant="primary" size="sm">
                    Direct Type-to-Search
                  </Badge>
                </div>

                <FormField
                  label="Standard Select Input"
                  helperText="Type directly inside this same input to filter options (No separate search popup!)"
                >
                  <SelectInput
                    placeholder="Type here to filter (e.g. App, Elect, Foot)..."
                    options={[
                      { value: "apparel", label: "Apparel & Garments" },
                      { value: "electronics", label: "Consumer Electronics" },
                      { value: "footwear", label: "Footwear & Shoes" },
                      { value: "luxury", label: "Luxury Chronograph Watches" },
                      { value: "beauty", label: "Beauty & Personal Care" },
                      { value: "home", label: "Home, Furniture & Kitchen" },
                      { value: "sports", label: "Sports & Fitness Equipment" },
                    ]}
                  />
                </FormField>

                <FormField
                  label="Searchable Select Dropdown"
                  helperText="Type to filter options instantly with match highlighting"
                >
                  <SearchableSelect
                    value={searchableSelectValue}
                    onChange={setSearchableSelectValue}
                    placeholder="Select category..."
                    searchPlaceholder="Type to filter (e.g. watch, shoes, tech)..."
                    options={[
                      { value: "electronics", label: "Consumer Electronics", group: "Technology", description: "Phones, audio & gadgets" },
                      { value: "laptops", label: "Laptops & Computers", group: "Technology", description: "Ultrabooks & gaming rigs" },
                      { value: "watch", label: "Luxury Chronograph Watches", group: "Accessories", description: "Swiss automatics & quartz" },
                      { value: "leather", label: "Handcrafted Leather Bags", group: "Accessories", description: "Full grain messenger & backpacks" },
                      { value: "sneakers", label: "Athletic Sneakers & Running", group: "Footwear", description: "Performance cushion footwear" },
                      { value: "boots", label: "Classic Chelsea Leather Boots", group: "Footwear", description: "Waterproof Goodyear welted" },
                      { value: "apparel", label: "Designer Apparel & Outerwear", group: "Apparel", description: "Jackets, hoodies & tees" },
                      { value: "jewelry", label: "Fine Jewelry & Precious Metals", group: "Accessories", description: "Rings, bracelets & chains" },
                    ]}
                  />
                </FormField>

                <FormField label="MultiSelect with Tag Badges" helperText="Select multiple tags with chip badges">
                  <MultiSelect
                    options={[
                      { value: "cat-apparel", label: "Apparel" },
                      { value: "cat-luxury", label: "Luxury" },
                      { value: "cat-accessories", label: "Accessories" },
                      { value: "cat-footwear", label: "Footwear" },
                    ]}
                    value={multiSelectValue}
                    onChange={setMultiSelectValue}
                  />
                </FormField>

                {/* Filter Dropdown Menu */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Searchable Filter Dropdown Menu</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Compact popover filter with counts and reset
                    </p>
                  </div>

                  <FilterDropdown
                    label="Product Category"
                    searchable
                    searchPlaceholder="Search category..."
                    selectedValue={dropdownFilterCategory}
                    onSelect={setDropdownFilterCategory}
                    onReset={() => setDropdownFilterCategory("")}
                    options={[
                      { value: "watch", label: "Watches", count: 42 },
                      { value: "bags", label: "Leather Bags", count: 18 },
                      { value: "audio", label: "Noise-Cancelling Audio", count: 29 },
                      { value: "footwear", label: "Shoes & Footwear", count: 64 },
                      { value: "apparel", label: "Clothing & Garments", count: 85 },
                      { value: "eyewear", label: "Polarized Sunglasses", count: 12 },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* ROW 2: Advanced Pickers & React Hook Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Card 3: Advanced Pickers, Slug, Swatches & Toggles */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pickers, Swatches & Switches
                  </h3>
                  <Badge variant="outline" size="sm">
                    Interactive
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField label="Interactive Date Picker" helperText="With calendar dropdown & presets">
                    <DatePicker
                      value={selectedDate}
                      onChange={setSelectedDate}
                      placeholder="Select publish date..."
                    />
                  </FormField>

                  <FormField label="Interactive Time Picker" helperText="With hour/min & AM/PM selector">
                    <TimePicker
                      value={selectedTime}
                      onChange={setSelectedTime}
                      placeholder="Select schedule time..."
                    />
                  </FormField>
                </div>

                <FormField label="Slug Input with Auto Format" helperText="Converts product title to SEO-friendly URL slug">
                  <SlugInput
                    value={slugValue}
                    onChange={setSlugValue}
                    onAutoGenerate={() => setSlugValue("auto-generated-product-url")}
                  />
                </FormField>

                <FormField label="Color Swatch Picker" helperText="Select curated palette color or custom hex">
                  <ColorPicker value={selectedColor} onChange={setSelectedColor} />
                </FormField>

                <FormField label="Toggle Switches (Sizes & Controlled States)">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <Switch
                      label="Notifications"
                      description="Size SM"
                      size="sm"
                      checked={demoSwitch1}
                      onCheckedChange={setDemoSwitch1}
                    />
                    <Switch
                      label="Dark Surface"
                      description="Size MD"
                      size="md"
                      checked={demoSwitch2}
                      onCheckedChange={setDemoSwitch2}
                    />
                  </div>
                </FormField>
              </div>

              {/* Card 4: Complete Validated Form */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Live React Hook Form + Zod
                    </h3>
                    <Badge variant="primary" size="sm">
                      Strict Validation
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                    <span>Field Nav:</span>
                    <Kbd keys={["↓", "or", "Enter"]} size="xs" />
                    <span>Submit:</span>
                    <Kbd keys={["Ctrl", "Enter"]} size="xs" />
                  </div>
                </div>

                <form
                  ref={formNavRef}
                  onKeyDown={handleFormKeyDown}
                  onSubmit={handleSubmit(onProductFormSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    label="Product Name"
                    required
                    error={errors.productName?.message}
                    helperText="Minimum 3 characters"
                  >
                    <TextInput
                      {...register("productName")}
                      error={!!errors.productName}
                      placeholder="e.g. Leather Chelsea Boots"
                    />
                  </FormField>

                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="SKU Code" required error={errors.sku?.message}>
                      <TextInput
                        {...register("sku")}
                        error={!!errors.sku}
                        placeholder="e.g. BOOT-404"
                      />
                    </FormField>

                    <FormField label="Retail Price" required error={errors.price?.message}>
                      <PriceInput
                        {...register("price")}
                        error={!!errors.price}
                        placeholder="189.00"
                      />
                    </FormField>
                  </div>

                  <FormField label="Category" required error={errors.category?.message}>
                    <SelectInput
                      {...register("category")}
                      error={!!errors.category}
                      placeholder="Choose category..."
                      options={[
                        { value: "apparel", label: "Apparel" },
                        { value: "accessories", label: "Accessories" },
                        { value: "footwear", label: "Footwear" },
                      ]}
                    />
                  </FormField>

                  <FormField
                    label="Description"
                    required
                    error={errors.description?.message}
                    helperText="At least 10 characters"
                  >
                    <TextArea
                      {...register("description")}
                      error={!!errors.description}
                      placeholder="Describe the product materials, fit, and origin..."
                      rows={3}
                    />
                  </FormField>

                  <div className="flex items-center justify-between pt-2">
                    <Switch
                      id="form-published"
                      label="Publish Immediately"
                      description="Visible to customers once saved"
                      checked={Boolean(watch("published"))}
                      onCheckedChange={(val) =>
                        setValue("published", val, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <FormActions align="right">
                    <Button type="button" variant="ghost" size="sm" onClick={() => reset()}>
                      Reset
                    </Button>
                    <Button type="submit" variant="primary" size="sm" loading={isSubmitting}>
                      Submit Product
                    </Button>
                  </FormActions>
                </form>
              </div>
            </div>

            {/* ROW 3: Specialized Enterprise Suite (UOM, Phone & Address) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Card 5: Unit of Measure (UOM) Suite */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-indigo-500" />
                      <span>Unit of Measure (UOM) Suite</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Powered by <code className="text-indigo-600 dark:text-indigo-400 font-semibold">convert-units</code>
                    </p>
                  </div>
                  <Badge variant="primary" size="sm">
                    UOM Engine
                  </Badge>
                </div>

                {/* Single Quantity UOM Input */}
                <FormField
                  label="1. Quantity & Single UOM Input"
                  helperText="Compound input with number stepper and unit dropdown"
                >
                  <UOMInput
                    value={uomValue}
                    onChange={setUomValue}
                    placeholder="Enter quantity (e.g. 100)"
                  />
                </FormField>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Selected Quantity:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {uomValue.amount || "0"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono font-bold text-xs uppercase border border-indigo-200/50 dark:border-indigo-800/50">
                      {uomValue.unit}
                    </span>
                  </div>
                </div>

                {/* UOM Multi Selector with Category Grouping & Primary Unit */}
                <FormField
                  label="2. UOM Multi-Select (Group Filtered & Primary Base Unit)"
                  helperText="First selected unit is Primary (⭐). Selecting 'kg' strictly groups compatible units (g, ton) with live conversions."
                >
                  <UOMMultiSelect
                    value={uomMultiValue}
                    onChange={(units) => {
                      setUomMultiValue(units);
                      if (units.length > 0) {
                        toast.info(
                          `Primary Unit: ${units[0].toUpperCase()}`,
                          `Selected ${units.length} compatible units in group.`
                        );
                      }
                    }}
                    showConversions={true}
                    lockCategory={true}
                  />
                </FormField>
              </div>

              {/* Card 6: International Localization Suite (Phone & Address) */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4 text-left">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <span>International Localization Suite</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Powered by <code className="text-indigo-600 dark:text-indigo-400 font-semibold">libphonenumber-js</code> & <code className="text-indigo-600 dark:text-indigo-400 font-semibold">country-state-city</code>
                    </p>
                  </div>
                  <Badge variant="success" size="sm">
                    Localization
                  </Badge>
                </div>

                {/* International Phone Input */}
                <FormField
                  label="1. Phone Number with Country Code"
                  helperText="Searchable country picker with flags, national formatting, live validity check, strictly capped at max 10 digits"
                >
                  <PhoneInput
                    value={phoneValue}
                    onChange={setPhoneValue}
                    defaultCountry="IN"
                    maxDigits={10}
                  />
                </FormField>

                {/* Phone Live Value Summary */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Parsed Phone:</span>
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-500">{phoneValue.dialCode}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {phoneValue.number || "—"}
                    </span>
                    {phoneValue.isValid ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px]">
                        VALID
                      </span>
                    ) : (
                      <span className="text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-[10px]">
                        INCOMPLETE
                      </span>
                    )}
                  </div>
                </div>

                {/* Cascading Address Form */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    2. Cascading Address with Direct Type-to-Search
                  </span>
                  <AddressInput
                    value={addressValue}
                    onChange={setAddressValue}
                    defaultCountry="IN"
                    showPreview
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 3. PROFESSIONAL TANSTACK DATATABLE */}
        {(activeCategory === "all" || activeCategory === "table") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>3. Professional TanStack DataTable</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Full-featured data table with global search, column sorting, pagination, column visibility
                toggle, multi-row selection, CSV export, and bulk action bar.
              </p>
            </div>

            <DataTable
              columns={tableColumns}
              data={SAMPLE_PRODUCTS}
              searchPlaceholder="Search products by title, SKU, or category..."
              exportFileName="noble-products-showcase"
              bulkActions={(selected) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() => {
                      setActionModal({
                        isOpen: true,
                        title: `Delete ${selected.length} Selected Items`,
                        message: `Are you sure you want to delete ${selected.length} selected products permanently? This action cannot be undone.`,
                        variant: "destructive",
                        confirmLabel: "Delete All",
                        onConfirm: () => {
                          setActionModal((prev) => ({ ...prev, isOpen: false }));
                          toast.error("Items Removed", `Deleted ${selected.length} items from database.`);
                        },
                      });
                    }}
                  >
                    Delete ({selected.length})
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      toast.success("Status Updated", `Marked ${selected.length} items as In Stock.`);
                    }}
                  >
                    Mark In Stock
                  </Button>
                </div>
              )}
            />

            {/* Standalone Reusable Pagination Showcase */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>Standalone Reusable &lt;Pagination /&gt; Component</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Accessible, UI-friendly pagination supporting numbered buttons, ellipsis truncation, rows-per-page selector, and responsive layouts. Usable with TanStack Table or any custom list.
                </p>
              </div>

              {/* Numbered Pagination Demo */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    1. Numbered Variant with Ellipsis & Total Count (Active Page: <strong className="text-indigo-600 dark:text-indigo-400">{demoPage}</strong>)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    variant=&quot;numbered&quot;
                  </span>
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
                  <Pagination
                    currentPage={demoPage}
                    totalPages={12}
                    totalItems={118}
                    pageSize={demoPageSize}
                    pageSizeOptions={[5, 10, 20, 50]}
                    onPageChange={(page) => {
                      setDemoPage(page);
                      toast.info(`Page ${page}`, `Navigated to page ${page} of 12`);
                    }}
                    onPageSizeChange={(size) => {
                      setDemoPageSize(size);
                      setDemoPage(1);
                      toast.success("Page Size Changed", `Displaying ${size} rows per page`);
                    }}
                    variant="numbered"
                    showPageSize={true}
                    showTotal={true}
                  />
                </div>
              </div>

              {/* Compact & Simple Variants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      2. Simple / Compact Variant
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      variant=&quot;compact&quot;
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <Pagination
                      currentPage={demoPage}
                      totalPages={12}
                      totalItems={118}
                      pageSize={demoPageSize}
                      onPageChange={(page) => setDemoPage(page)}
                      variant="compact"
                      showPageSize={false}
                      showTotal={true}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      3. Minimal Prev / Next Only
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      showTotal=false
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                    <Pagination
                      currentPage={demoPage}
                      totalPages={12}
                      pageSize={demoPageSize}
                      onPageChange={(page) => setDemoPage(page)}
                      variant="simple"
                      showPageSize={false}
                      showTotal={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. MODALS, DIALOGS & OVERLAYS */}
        {(activeCategory === "all" || activeCategory === "modals") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>4. Modal, Dialog & Overlay System</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Base modal with keyboard ESC dismissal, backdrop scroll-lock, confirmation alerts,
                slide-over drawer, and tooltips.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Trigger Overlay Dialogs
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm" onClick={() => setIsBasicModalOpen(true)}>
                  Open General Modal
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsConfirmOpen(true)}>
                  Open Confirm Dialog
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                  Open Delete Confirm Dialog
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(true)}>
                  Open Slide Drawer
                </Button>
              </div>

              {/* Tooltip Demonstration */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                <span className="text-xs font-semibold text-slate-500">Tooltips:</span>
                <Tooltip content="Quick action tooltip (Top)" position="top">
                  <Button variant="outline" size="xs">
                    Hover Top
                  </Button>
                </Tooltip>
                <Tooltip content="Filter options available (Bottom)" position="bottom">
                  <Button variant="outline" size="xs">
                    Hover Bottom
                  </Button>
                </Tooltip>
                <Tooltip content="Destructive operation (Right)" position="right">
                  <Button variant="ghost" size="xs">
                    Hover Right
                  </Button>
                </Tooltip>
              </div>
            </div>

            {/* General Modal Instance */}
            <Modal
              isOpen={isBasicModalOpen}
              onClose={() => setIsBasicModalOpen(false)}
              title="Quick Product Information"
              description="Review essential product parameters before synchronizing inventory."
              size="md"
            >
              <div className="space-y-4 text-left">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  This dialog utilizes an accessible backdrop, automatic scroll-locking, and escape key
                  listening to maintain keyboard focus within the dialog body.
                </p>
                <FormField label="Warehouse Location">
                  <TextInput placeholder="Warehouse A - Bin #42" defaultValue="Central Hub (Dallas)" />
                </FormField>
                <ModalFooter>
                  <Button variant="ghost" size="sm" onClick={() => setIsBasicModalOpen(false)}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      toast.success("Changes Applied", "Warehouse parameters updated successfully.");
                      setIsBasicModalOpen(false);
                    }}
                  >
                    Save & Apply
                  </Button>
                </ModalFooter>
              </div>
            </Modal>

            {/* Confirm Dialog Instance */}
            <ConfirmDialog
              isOpen={isConfirmOpen}
              onClose={() => setIsConfirmOpen(false)}
              onConfirm={() => {
                toast.success("Category Published", "Luxury Accessories collection is now live.");
                setIsConfirmOpen(false);
              }}
              title="Publish Category"
              message="Are you sure you want to publish the 'Luxury Accessories' collection to the live storefront?"
              confirmLabel="Publish Now"
            />

            {/* Delete Confirmation Dialog Instance */}
            <DeleteConfirmDialog
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              onDelete={() => {
                toast.error("Item Removed", "Chronograph Automatic Watch has been permanently deleted.");
                setIsDeleteOpen(false);
              }}
              itemName="Chronograph Automatic Watch"
            />

            {/* Slide-over Drawer Instance */}
            <Drawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              title="Faceted Product Filters"
              description="Refine your catalog listing by status, category, and price range."
              size="md"
            >
              <div className="space-y-5 text-left">
                <FormField label="Category Filter">
                  <SelectInput
                    options={[
                      { value: "all", label: "All Categories" },
                      { value: "accessories", label: "Accessories" },
                      { value: "apparel", label: "Apparel" },
                      { value: "footwear", label: "Footwear" },
                    ]}
                  />
                </FormField>

                <FormField label="Stock Status">
                  <RadioGroup
                    name="drawer-stock-filter"
                    options={[
                      { value: "all", label: "All items" },
                      { value: "instock", label: "In Stock Only" },
                      { value: "lowstock", label: "Low Stock Alert" },
                    ]}
                    value="all"
                  />
                </FormField>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <Button fullWidth variant="primary" size="sm" onClick={() => setIsDrawerOpen(false)}>
                    Apply Filters
                  </Button>
                  <Button
                    fullWidth
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </Drawer>
          </section>
        )}

        {/* 5. FEEDBACK, BADGES & STATUSES */}
        {(activeCategory === "all" || activeCategory === "feedback") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>5. Badges, Feedback & Progress</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Alert notifications, pill badges, e-commerce order and stock badges, loading skeletons,
                and spinners.
              </p>
            </div>

            {/* Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Alert variant="info" title="System Maintenance">
                Scheduled automated database maintenance is planned tonight at 02:00 AM UTC.
              </Alert>
              <Alert variant="success" title="Payment Verified">
                Order #ORD-7740 payment confirmed via Razorpay gateway.
              </Alert>
              <Alert variant="warning" title="Low Inventory Warning">
                Cashmere Knit Sweater has only 8 units left in stock.
              </Alert>
              <Alert variant="danger" title="Shipment Failure">
                Address validation failed for customer parcel delivery in Zipcode 94103.
              </Alert>
            </div>

            {/* Badges & Statuses */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Badge Variants & Prominent Sizes
                  </h3>
                  <span className="text-[11px] text-indigo-500 font-semibold">
                    Higher Contrast & Larger Typography
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400 w-16">Size LG:</span>
                    <Badge variant="primary" size="lg">Primary Large</Badge>
                    <Badge variant="success" size="lg">Success Large</Badge>
                    <Badge variant="warning" size="lg">Warning Large</Badge>
                    <Badge variant="danger" size="lg">Danger Large</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400 w-16">Size MD:</span>
                    {(
                      ["primary", "secondary", "success", "warning", "danger", "info", "outline"] as BadgeVariant[]
                    ).map((b) => (
                      <Badge key={b} variant={b} size="md">
                        {b}
                      </Badge>
                    ))}
                    <Badge variant="primary" rounded size="md">
                      Rounded Pill
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-400 w-16">Size SM:</span>
                    <Badge variant="primary" size="sm">Primary SM</Badge>
                    <Badge variant="success" size="sm">Success SM</Badge>
                    <Badge variant="warning" size="sm">Warning SM</Badge>
                    <Badge variant="danger" size="sm">Danger SM</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    E-Commerce Order & Inventory Statuses (With Live Pulse Dots)
                  </h3>
                  <span className="text-[11px] text-emerald-500 font-semibold">
                    Pulsing Animated Glow
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status="Paid" size="md" />
                  <StatusBadge status="Pending" size="md" />
                  <StatusBadge status="Processing" size="md" />
                  <StatusBadge status="Shipped" size="md" />
                  <StatusBadge status="Delivered" size="md" />
                  <StatusBadge status="Cancelled" size="md" />
                  <StatusBadge status="In Stock" size="md" />
                  <StatusBadge status="Low Stock" size="md" />
                  <StatusBadge status="Out of Stock" size="md" />
                </div>
              </div>

              {/* Universal Common Loader Component Suite */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Universal Common Loader Component
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Reusable for buttons, cards, table states, and full-screen route transitions.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsFullscreenLoaderActive(true);
                      setTimeout(() => setIsFullscreenLoaderActive(false), 2000);
                    }}
                  >
                    Test Fullscreen Overlay
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 gap-2">
                    <Loader variant="spinner" size="md" />
                    <span className="text-[11px] font-semibold text-slate-500">Dual Spinner</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 gap-2">
                    <Loader variant="dots" size="md" />
                    <span className="text-[11px] font-semibold text-slate-500">Wave Dots</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 gap-2">
                    <Loader variant="pulse" size="md" />
                    <span className="text-[11px] font-semibold text-slate-500">Glowing Pulse</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 gap-2">
                    <Loader variant="bar" />
                    <span className="text-[11px] font-semibold text-slate-500">Indeterminate Bar</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 gap-2">
                    <Loader variant="brand" size="md" />
                    <span className="text-[11px] font-semibold text-slate-500">Brand Logo</span>
                  </div>
                </div>
              </div>

              {/* Progress and Skeletons */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Progress Bars
                  </h3>
                  <ProgressBar value={72} showValue variant="primary" />
                  <ProgressBar value={45} showValue variant="success" size="sm" />
                  <ProgressBar value={90} showValue variant="warning" size="lg" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Skeletons
                  </h3>
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* Error State Showcase with Navigation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <ErrorState
                title="Transaction Gateway Unreachable"
                message="Unable to communicate with the payment server. Please verify network status or retry."
                onRetry={() => toast.info("Reconnecting", "Attempting to reconnect to gateway...")}
                homeHref="/dashboard"
              />

              <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Global Error & 404 Route Handling
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                  Next.js App Router includes custom 404 Not Found and 500 Error boundary pages with
                  instant navigation back to safety.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Link href="/non-existent-page">
                    <Button variant="outline" size="sm">
                      Test 404 Error Page
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="primary" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Fullscreen Loader test overlay */}
            {isFullscreenLoaderActive && (
              <Loader
                fullscreen
                variant="brand"
                text="Loading store catalog, please wait..."
              />
            )}
          </section>
        )}

        {/* 6. CARDS, METRICS & PRODUCT DISPLAY */}
        {(activeCategory === "all" || activeCategory === "cards") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>6. Cards & Metric Displays</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dashboard metric stat cards and customer-facing e-commerce product cards with quick view
                and cart handlers.
              </p>
            </div>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value="$148,290.00"
                change={14.2}
                icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
              />
              <StatCard
                title="Total Orders"
                value="1,429"
                change={8.5}
                icon={<ShoppingCart className="w-4 h-4 text-indigo-500" />}
              />
              <StatCard
                title="Active Customers"
                value="12,850"
                change={-2.1}
                icon={<Users className="w-4 h-4 text-sky-500" />}
              />
              <StatCard
                title="Conversion Rate"
                value="3.84%"
                change={5.9}
                icon={<TrendingUp className="w-4 h-4 text-amber-500" />}
              />
            </div>

            {/* Product Cards Grid */}
            <div className="space-y-3 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                E-Commerce Product Card Catalog Grid
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {SAMPLE_PRODUCTS.slice(0, 4).map((prod) => (
                  <ProductCard
                    key={prod.id}
                    id={prod.id}
                    name={prod.name}
                    category={prod.category}
                    price={prod.price}
                    originalPrice={prod.originalPrice}
                    rating={prod.rating}
                    reviewsCount={prod.reviewsCount}
                    imageUrl={prod.imageUrl}
                    isSale={!!prod.originalPrice}
                    isNew={prod.id === "prod-1"}
                    inStock={prod.stock > 0}
                    onAddToCart={() => {
                      toast.success(
                        "Added to Cart",
                        `1x "${prod.name}" has been added to your shopping bag.`
                      );
                    }}
                    onQuickView={() => {
                      setIsBasicModalOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. REAL-TIME & WEBSOCKETS */}
        {(activeCategory === "all" || activeCategory === "realtime") && (
          <section className="space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 text-left">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-500 shrink-0" />
                <span>7. Real-Time Engine & WebSocket System</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Industrial bi-directional Socket.io architecture with live orders, broadcast announcements,
                latency ping/pong heartbeat, and peer presence tracking.
              </p>
            </div>

            <RealtimeSocketPlayground />
          </section>
        )}
      </div>

      {/* Dynamic In-App Action Confirmation Modal (replaces native Chrome alerts) */}
      <ConfirmDialog
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (actionModal.onConfirm) {
            actionModal.onConfirm();
          } else {
            setActionModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        title={actionModal.title}
        message={actionModal.message}
        confirmLabel={actionModal.confirmLabel || "Confirm"}
        cancelLabel={actionModal.cancelLabel || "Cancel"}
        confirmVariant={actionModal.variant || "primary"}
      />
    </AppLayout>
    </ToastProvider>
  );
}
