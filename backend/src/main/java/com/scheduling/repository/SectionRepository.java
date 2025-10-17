package com.scheduling.repository;

import com.scheduling.model.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SectionRepository extends JpaRepository<Section, Long> {
    
    Optional<Section> findBySectionName(String sectionName);
    
}

