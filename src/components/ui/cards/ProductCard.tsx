"use client";

import React from "react";
import { ShoppingBag, Star, Heart } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "../button/Button";
import { Badge } from "../feedback/Badge";

export interface ProductCardProps {
  id: string;
  name: string;
  category?: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewsCount?: number;
  imageUrl?: string;
  isNew?: boolean;
  isSale?: boolean;
  inStock?: boolean;
  onAddToCart?: (id: string) => void;
  onQuickView?: (id: string) => void;
  className?: string;
}

export function ProductCard({
  id,
  name,
  category,
  price,
  originalPrice,
  rating = 4.8,
  reviewsCount = 42,
  imageUrl,
  isNew = false,
  isSale = false,
  inStock = true,
  onAddToCart,
  onQuickView,
  className,
}: ProductCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col",
        className
      )}
    >
      {/* Top Image area */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center font-bold text-lg">
            {name.substring(0, 2).toUpperCase()}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {isSale && (
            <Badge variant="danger" size="sm" rounded>
              SALE
            </Badge>
          )}
          {isNew && (
            <Badge variant="primary" size="sm" rounded>
              NEW
            </Badge>
          )}
          {!inStock && (
            <Badge variant="secondary" size="sm" rounded>
              Sold Out
            </Badge>
          )}
        </div>

        {/* Quick action buttons */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            type="button"
            className="p-2 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 shadow-md hover:text-rose-500 transition-colors"
            title="Wishlist"
          >
            <Heart className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick View Button on Hover */}
        {onQuickView && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-10">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => onQuickView(id)}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs text-xs font-bold shadow-md"
            >
              Quick View
            </Button>
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {category && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {category}
            </span>
          )}
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {name}
          </h4>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {rating.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">({reviewsCount})</span>
          </div>
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-[10px] text-slate-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          <Button
            size="xs"
            variant={inStock ? "primary" : "secondary"}
            disabled={!inStock}
            leftIcon={<ShoppingBag className="w-3.5 h-3.5" />}
            onClick={() => onAddToCart?.(id)}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
