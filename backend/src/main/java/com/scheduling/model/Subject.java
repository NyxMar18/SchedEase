package com.scheduling.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Entity
@Table(name = "subjects")
public class Subject {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Subject name is required")
    @Column(unique = true)
    private String name;
    
    @NotBlank(message = "Subject code is required")
    @Column(unique = true)
    private String code;
    
    @NotNull(message = "Duration per week is required")
    @Positive(message = "Duration must be positive")
    private Integer durationPerWeek; // Hours per week
    
    @NotBlank(message = "Required room type is required")
    private String requiredRoomType;
    
    @NotNull(message = "Priority is required")
    @Positive(message = "Priority must be positive")
    private Integer priority; // Higher number = higher priority
    
    private String description;
    
    // Constructors
    public Subject() {}
    
    public Subject(String name, String code, Integer durationPerWeek, String requiredRoomType, Integer priority) {
        this.name = name;
        this.code = code;
        this.durationPerWeek = durationPerWeek;
        this.requiredRoomType = requiredRoomType;
        this.priority = priority;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCode() {
        return code;
    }
    
    public void setCode(String code) {
        this.code = code;
    }
    
    public Integer getDurationPerWeek() {
        return durationPerWeek;
    }
    
    public void setDurationPerWeek(Integer durationPerWeek) {
        this.durationPerWeek = durationPerWeek;
    }
    
    public String getRequiredRoomType() {
        return requiredRoomType;
    }
    
    public void setRequiredRoomType(String requiredRoomType) {
        this.requiredRoomType = requiredRoomType;
    }
    
    public Integer getPriority() {
        return priority;
    }
    
    public void setPriority(Integer priority) {
        this.priority = priority;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
}

