package com.yegyu.lyricinsight.repo;

import com.yegyu.lyricinsight.domain.Analysis;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {

    @Query("select a from Analysis a order by a.createdAt desc")
    List<Analysis> findRecent(Pageable pageable);
}
