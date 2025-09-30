"use client";
import React from "react";
import styles from "./GlassCard.module.css";

const GlassCard = ({ children, width, height }) => {
  return (
    <div
      className={styles.glassCard}
      style={{ width: width, height: height }}
    >
      {children}
    </div>
  );
};

export default GlassCard;
